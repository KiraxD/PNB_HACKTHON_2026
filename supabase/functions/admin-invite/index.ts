import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_ROLES = new Set(["soc", "admin", "compliance"]);

// Rate limiting: max 10 invites per admin per hour
const RATE_LIMIT_MAP = new Map<string, { count: number; resetTime: number }>();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function checkRateLimit(userId: string): { allowed: boolean; remainingRequests: number } {
  const now = Date.now();
  const userLimit = RATE_LIMIT_MAP.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    RATE_LIMIT_MAP.set(userId, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return { allowed: true, remainingRequests: 9 };
  }

  if (userLimit.count >= 10) {
    return { allowed: false, remainingRequests: 0 };
  }

  userLimit.count++;
  return { allowed: true, remainingRequests: 10 - userLimit.count };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Missing required Supabase environment variables." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header." }, 401);
    }

    // Validate token format
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Invalid Authorization header format." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Get user from token - validates token server-side
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "Unable to resolve the current user. Token may be invalid or expired." }, 401);
    }

    // CRITICAL: Query DB for admin status - NEVER trust client claims
    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("role,status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return json({ error: profileError.message }, 500);
    }

    if (!callerProfile || callerProfile.role !== "admin" || callerProfile.status !== "active") {
      return json({ error: "Only active admin users can send invites." }, 403);
    }

    // Apply rate limiting
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return json(
        { 
          error: "Rate limit exceeded. Maximum 10 invites per hour per admin.",
          retryAfter: 3600,
        },
        429
      );
    }

    const payload = await req.json();
    const email = String(payload?.email || "").trim().toLowerCase();
    const fullName = String(payload?.full_name || "").trim();
    const requestedRole = String(payload?.role || "soc").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return json({ error: "A valid email address is required." }, 400);
    }

    if (!ALLOWED_ROLES.has(requestedRole)) {
      return json({ error: "Invalid role requested." }, 400);
    }

    const inviteResponse = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        requested_role: requestedRole,
      },
    });

    if (inviteResponse.error) {
      return json({ error: inviteResponse.error.message }, 400);
    }

    const invitedUserId = inviteResponse.data.user?.id;
    if (invitedUserId && requestedRole !== "soc") {
      const { error: roleError } = await adminClient
        .from("profiles")
        .update({ role: requestedRole })
        .eq("id", invitedUserId);

      if (roleError) {
        return json({ error: roleError.message }, 500);
      }
    }

    await adminClient.from("audit_log").insert({
      user_id: user.id,
      action: "USER_INVITED",
      target: email,
      icon: "👤",
    });

    return json(
      {
        success: true,
        invited_email: email,
        requested_role: requestedRole,
        remainingInvites: rateLimit.remainingRequests,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[admin-invite] Error:", message);
    return json({ error: message }, 500);
  }
});
