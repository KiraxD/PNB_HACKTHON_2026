#!/usr/bin/env python3
"""
QSecure Radar — Database Cleanup Script
Clears all scan, asset, and vulnerability data from Supabase
"""

import os
import sys
from supabase import create_client

# Supabase credentials (from config)
SUPABASE_URL = "https://shinmrlkbaggbwpzhlcl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaW5tcmxrYmFnZ2J3cHpobGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMjQ5OTksImV4cCI6MjA4OTcwMDk5OX0.xYRrKNOdUD3g-APqEGSx9yG6qg6YpCeziIGY-gqPYhA"

# Read SQL commands


def read_sql_file(filename):
    with open(filename, 'r') as f:
        return f.read()


def clear_database():
    try:
        # Initialize Supabase client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        print("🔄 Connecting to Supabase...")
        print(f"   Project: {SUPABASE_URL}\n")

        # Tables to clear (in correct order due to FK constraints)
        tables_to_clear = [
            'scan_history',
            'reports',
            'audit_log',
            'cbom',
            'cyber_rating',
            'pqc_scores',
            'software',
            'nameservers',
            'crypto_overview',
            'ip_subnets',
            'ssl_certs',
            'domains',
            'assets'
        ]

        print("🗑️  Clearing tables...")
        for table in tables_to_clear:
            try:
                supabase.table(table).delete().neq(
                    'id', '00000000-0000-0000-0000-000000000000').execute()
                print(f"   ✅ {table}")
            except Exception as e:
                print(f"   ⚠️  {table}: {str(e)}")

        print("\n📊 Verifying tables are empty...\n")

        # Verify each table is empty
        for table in tables_to_clear:
            try:
                response = supabase.table(table).select(
                    'COUNT()', count='exact').execute()
                count = response.count if hasattr(response, 'count') else 0
                status = "✅ EMPTY" if count == 0 else f"⚠️  {count} rows remain"
                print(f"   {table:<20} {status}")
            except Exception as e:
                print(f"   {table:<20} ⚠️  Could not verify")

        print("\n" + "="*60)
        print("✨ Database cleared successfully!")
        print("="*60)
        print("\n📋 Next steps:")
        print("   1. Run supabase/fresh-seed.sql to load sample assets")
        print("   2. Refresh dashboard to see fresh asset inventory")
        print("   3. Start scanning with Unified Scanner\n")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    clear_database()
