import psycopg2

POSTGRES_URI = 'postgresql://postgres.nfveklkbjitgsdwdqpkd:Mnsy%4019950125026426@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'

def main():
    pg_conn = psycopg2.connect(POSTGRES_URI)
    pg_curr = pg_conn.cursor()
    
    tables = [
        "Category",
        "Product",
        "User",
        "Sale",
        "SaleItem",
        "Expense",
        "Notification",
        "Session"
    ]
    
    for table in tables:
        # Get the current maximum ID
        pg_curr.execute(f'SELECT MAX(id) FROM "{table}"')
        result = pg_curr.fetchone()
        
        # If there are rows, set the sequence to MAX + 1
        if result and result[0] is not None:
            max_id = result[0]
            # setval(sequence_name, next_value, is_called=false)
            seq_name = f'"{table}_id_seq"'
            query = f"SELECT setval('{seq_name}', {max_id + 1}, false);"
            try:
                pg_curr.execute(query)
                print(f"Set sequence {seq_name} to {max_id + 1}")
            except Exception as e:
                print(f"Error setting sequence for {table}: {e}")
                pg_conn.rollback() # rollback in case it's string IDs or something else
        else:
             print(f"Table {table} is empty or has no numeric ID, skipping.")

    pg_conn.commit()
    print("Sequences reset successfully!")
    pg_conn.close()

if __name__ == '__main__':
    main()
