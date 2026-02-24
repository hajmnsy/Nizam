import sqlite3
import psycopg2
from datetime import datetime

# Connection strings
SQLITE_DB = 'prisma/dev.db'
POSTGRES_URI = 'postgresql://postgres.nfveklkbjitgsdwdqpkd:Mnsy%4019950125026426@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'

def convert_row(row, columns):
    new_row = []
    for i, col in enumerate(columns):
        val = row[i]
        # Prisma DateTimes are stored as numeric milliseconds in SQLite
        if isinstance(val, int) and ('At' in col or col == 'date' or col == 'expiresAt'):
            # Convert milliseconds to datetime
            try:
                # Need to handle potential seconds vs milliseconds.
                # Prisma generates 13-digit ms timestamps for SQLite usually.
                if val > 9999999999:
                    val = datetime.fromtimestamp(val / 1000.0)
                else:
                    val = datetime.fromtimestamp(val)
            except Exception:
                pass
        new_row.append(val)
    return tuple(new_row)

def migrate_table(sqlite_curr, pg_curr, table_name):
    print(f"Migrating table: {table_name}")
    
    sqlite_curr.execute(f"PRAGMA table_info({table_name})")
    columns_info = sqlite_curr.fetchall()
    if not columns_info:
        print(f"Table {table_name} not found or empty.")
        return
        
    columns = [col[1] for col in columns_info]
    pg_columns = [f'"{col}"' for col in columns]
    
    sqlite_curr.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_curr.fetchall()
    print(f"  Found {len(rows)} rows.")
    
    if len(rows) == 0:
        return
        
    placeholders = ', '.join(['%s'] * len(columns))
    columns_str = ', '.join(pg_columns)
    
    conflict_col = "id"
    if table_name == "User" and "id" not in columns:
        conflict_col = "username" 
        
    query = f"""
        INSERT INTO "{table_name}" ({columns_str}) 
        VALUES ({placeholders}) 
        ON CONFLICT ("{conflict_col}") DO NOTHING
    """
    
    for row in rows:
        converted_row = convert_row(row, columns)
        try:
            pg_curr.execute(query, converted_row)
        except Exception as e:
            print(f"  Error inserting row {row[0]}: {e}")
            pg_curr.connection.rollback()
            return

def main():
    print("Connecting to databases...")
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_curr = sqlite_conn.cursor()

    pg_conn = psycopg2.connect(POSTGRES_URI)
    pg_curr = pg_conn.cursor()
    
    # Order matters due to foreign key constraints!
    tables_to_migrate = [
        "Category",
        "Product",
        "User",
        "Sale",
        "SaleItem",
        "Expense",
        "Notification"
    ]
    
    for table in tables_to_migrate:
        migrate_table(sqlite_curr, pg_curr, table)

    pg_conn.commit()
    print("Migration completed successfully!")

    sqlite_conn.close()
    pg_conn.close()

if __name__ == '__main__':
    main()
