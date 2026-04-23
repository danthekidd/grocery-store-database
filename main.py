import os
import sqlite3
import hashlib
from datetime import date

from rich.console import Console
from rich.table import Table
from rich.prompt import Prompt, IntPrompt, FloatPrompt, Confirm


class GroceryApp:
    DB_PATH = "db/grocery.db"
    SCHEMA_PATH = "schema.sql"

    def __init__(self):
        self.console = Console(highlight=False)
        self._make_db_folder()
        self.initialize_database()

    def run(self):
        self.main_menu()

    def _make_db_folder(self):
        db_dir = os.path.dirname(self.DB_PATH)
        os.makedirs(db_dir, exist_ok=True)

    def _clear_screen(self):
        os.system("cls" if os.name == "nt" else "clear")

    def _pause(self):
        self.console.print()
        Prompt.ask("Press Enter to continue", default="")

    def get_connection(self):
        conn = sqlite3.connect(self.DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON")
        cursor = conn.cursor()
        return conn, cursor

    def initialize_database(self):
        conn, cursor = self.get_connection()
        try:
            with open(self.SCHEMA_PATH, "r", encoding="utf-8") as f:
                cursor.executescript(f.read())

            cursor.execute("PRAGMA table_info(customers)")
            customer_columns = {row[1] for row in cursor.fetchall()}
            if "password_hash" not in customer_columns:
                cursor.execute("ALTER TABLE customers ADD COLUMN password_hash TEXT")
            if "is_admin" not in customer_columns:
                cursor.execute("ALTER TABLE customers ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")

            conn.commit()
        finally:
            conn.close()

    def _hash_password(self, password: str) -> str:
        salt_hex = os.urandom(16).hex()
        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt_hex.encode("utf-8"),
            n=16384,
            r=8,
            p=1,
            dklen=64,
        )
        return f"scrypt${salt_hex}${derived.hex()}"

    def _validate_password_strength(self, password: str):
        if len(password) < 8:
            return "Password must be at least 8 characters."

        has_lower = any(ch.islower() for ch in password)
        has_upper = any(ch.isupper() for ch in password)
        has_digit = any(ch.isdigit() for ch in password)

        if not (has_lower and has_upper and has_digit):
            return "Password must include uppercase, lowercase, and a number."

        return None

    def main_menu(self):
        while True:
            self._clear_screen()
            self.console.rule("[bold magenta]Grocery Store App[/bold magenta]", style="magenta")

            self.console.print()
            self.console.print("[dim]1.[/dim] Products")
            self.console.print("[dim]2.[/dim] Customers")
            self.console.print("[dim]3.[/dim] Orders")
            self.console.print("[dim]4.[/dim] Reports")
            self.console.print("[dim]5.[/dim] Exit")
            self.console.print()

            choice = Prompt.ask(
                choices=["1", "2", "3", "4", "5"]
            )

            if choice == "1":
                self.product_menu()
            elif choice == "2":
                self.customer_menu()
            elif choice == "3":
                self.order_menu()
            elif choice == "4":
                self.report_menu()
            elif choice == "5":
                break

    def product_menu(self):
        while True:
            self._clear_screen()
            self.console.rule("[bold magenta]Product Menu[/bold magenta]", style="magenta")

            self.console.print()
            self.console.print("[dim]1.[/dim] Add Product")
            self.console.print("[dim]2.[/dim] View Products")
            self.console.print("[dim]3.[/dim] Delete Product")
            self.console.print("[dim]4.[/dim] Update Product Stock")
            self.console.print("[dim]5.[/dim] Add Category")
            self.console.print("[dim]6.[/dim] View Categories")
            self.console.print("[dim]7.[/dim] Back")
            self.console.print()

            choice = Prompt.ask(
                choices=["1", "2", "3", "4", "5", "6", "7"],
            )

            if choice == "1":
                self.add_product()
            elif choice == "2":
                self.view_products()
            elif choice == "3":
                self.delete_product()
            elif choice == "4":
                self.update_product_stock()
            elif choice == "5":
                self.add_category()
            elif choice == "6":
                self.view_categories()
            elif choice == "7":
                break
    def no_menu(self):
        self._clear_screen()
        self.console.print("[red]Customer menu not built yet.[/red]")
        self._pause()

    def customer_menu(self):
        while True:
            self._clear_screen()
            self.console.rule("[bold magenta]Customer Menu[/bold magenta]", style="magenta")

            self.console.print()
            self.console.print("[dim]1.[/dim] Add Customer")
            self.console.print("[dim]2.[/dim] View Customers")
            self.console.print("[dim]3.[/dim] Delete Customer")
            self.console.print("[dim]4.[/dim] Set/Update Password")
            self.console.print("[dim]5.[/dim] Set Admin Access")
            self.console.print("[dim]6.[/dim] Back")
            self.console.print()

            choice = Prompt.ask(
                choices=["1", "2", "3", "4", "5", "6"],
            )

            if choice == "1":
                self.add_customer()
            elif choice == "2":
                self.view_customers()
            elif choice == "3":
                self.delete_customer()
            elif choice == "4":
                self.set_customer_password()
            elif choice == "5":
                self.set_customer_admin_access()
            elif choice == "6":
                break

    def order_menu(self):
        while True:
            self._clear_screen()
            self.console.rule("[bold magenta]Order Menu[/bold magenta]", style="magenta")

            self.console.print()
            self.console.print("[dim]1.[/dim] Create Order")
            self.console.print("[dim]2.[/dim] View Orders")
            self.console.print("[dim]3.[/dim] Back")
            self.console.print()

            choice = Prompt.ask(
                choices=["1", "2", "3"],
            )

            if choice == "1":
                self.create_order()
            elif choice == "2":
                self.view_orders()
            elif choice == "3":
                break

    def report_menu(self):
        while True:
            self._clear_screen()
            self.console.rule("[bold magenta]Reports[/bold magenta]", style="magenta")

            self.console.print()
            self.console.print("[dim]1.[/dim] Low Stock")
            self.console.print("[dim]2.[/dim] Top Selling Products")
            self.console.print("[dim]3.[/dim] Customer Spend")
            self.console.print("[dim]4.[/dim] Back")
            self.console.print()

            choice = Prompt.ask(
                choices=["1", "2", "3", "4"],
            )

            if choice == "1":
                self.report_low_stock()
            elif choice == "2":
                self.report_top_products()
            elif choice == "3":
                self.report_customer_spend()
            elif choice == "4":
                break

    def add_customer(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Add Customer[/bold magenta]", style="magenta")
        
        self.console.print()

        first_name = Prompt.ask("First name").strip()
        last_name = Prompt.ask("Last name").strip()
        phone = Prompt.ask("Phone").strip()

        conn, cursor = self.get_connection()
        try:
            cursor.execute("""
                INSERT INTO customers (first_name, last_name, phone)
                VALUES (?, ?, ?)
            """, (first_name, last_name, phone))
            conn.commit()
            self.console.print("[bold green]Customer added successfully.[/bold green]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def view_customers(self):
        self._clear_screen()
        self.console.rule("[bold magenta]All Customers[/bold magenta]", style="magenta")

        self.console.print()

        conn, cursor = self.get_connection()
        try:
            cursor.execute("""
                SELECT customer_id, first_name, last_name, phone, is_admin
                FROM customers
                ORDER BY customer_id
            """)
            rows = cursor.fetchall()
        finally:
            conn.close()

        if not rows:
            self.console.print("[red]No Customers found.[/red]")
        else:
            table = Table(title="Customers", show_lines=True)
            table.add_column("Customer ID", justify="right")
            table.add_column("First Name")
            table.add_column("Last Name")
            table.add_column("Phone Number")
            table.add_column("Role")

            for row in rows:
                role = "Admin" if row[4] == 1 else "Customer"
                table.add_row(str(row[0]), row[1], row[2], row[3], role)

            self.console.print(table)

        self._pause()

    def delete_customer(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Delete Customer[/bold magenta]", style="magenta")

        self.console.print()
        customer_id = IntPrompt.ask("Enter customer ID to delete")

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM orders
                WHERE customer_id = ?
                """,
                (customer_id,),
            )
            order_count = cursor.fetchone()[0]

            if order_count > 0:
                self.console.print("[yellow]Cannot delete customer with existing orders.[/yellow]")
                self._pause()
                return

            confirm = Confirm.ask("Are you sure you want to delete this customer?", default=False)
            if not confirm:
                self.console.print("[yellow]Delete cancelled.[/yellow]")
                self._pause()
                return

            cursor.execute("DELETE FROM customers WHERE customer_id = ?", (customer_id,))
            conn.commit()

            if cursor.rowcount == 0:
                self.console.print("[yellow]No customer found with that ID.[/yellow]")
            else:
                self.console.print("[bold green]Customer deleted successfully.[/bold green]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def set_customer_password(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Set Customer Password[/bold magenta]", style="magenta")
        self.console.print()

        customer_id = IntPrompt.ask("Customer ID")
        new_password = Prompt.ask("New password", password=True)
        confirm_password = Prompt.ask("Confirm password", password=True)

        if new_password != confirm_password:
            self.console.print("[red]Passwords do not match.[/red]")
            self._pause()
            return

        validation_error = self._validate_password_strength(new_password)
        if validation_error:
            self.console.print(f"[red]{validation_error}[/red]")
            self._pause()
            return

        password_hash = self._hash_password(new_password)

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                UPDATE customers
                SET password_hash = ?
                WHERE customer_id = ?
                """,
                (password_hash, customer_id),
            )

            if cursor.rowcount == 0:
                self.console.print("[yellow]No customer found with that ID.[/yellow]")
            else:
                conn.commit()
                self.console.print("[bold green]Password updated successfully.[/bold green]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def set_customer_admin_access(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Set Customer Admin Access[/bold magenta]", style="magenta")
        self.console.print()

        customer_id = IntPrompt.ask("Customer ID")
        make_admin = Confirm.ask("Grant admin access? (No removes admin access)", default=True)

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                UPDATE customers
                SET is_admin = ?
                WHERE customer_id = ?
                """,
                (1 if make_admin else 0, customer_id),
            )

            if cursor.rowcount == 0:
                self.console.print("[yellow]No customer found with that ID.[/yellow]")
            else:
                conn.commit()
                role_label = "Admin" if make_admin else "Customer"
                self.console.print(f"[bold green]Access updated to {role_label}.[/bold green]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def add_product(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Add Product[/bold magenta]", style="magenta")

        self.console.print()

        sku = Prompt.ask("SKU").strip()
        product_name = Prompt.ask("Product name").strip()
        price = FloatPrompt.ask("Price")
        stock_quantity = IntPrompt.ask("Stock quantity")

        conn, cursor = self.get_connection()
        try:
            cursor.execute("""
                INSERT INTO products (sku, product_name, price, stock_quantity)
                VALUES (?, ?, ?, ?)
            """, (sku, product_name, price, stock_quantity))
            conn.commit()
            self.console.print("[bold green]Product added successfully.[/bold green]")
        except sqlite3.IntegrityError:
            self.console.print("[red]That SKU already exists.[/red]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def view_products(self):
        self._clear_screen()
        self.console.rule("[bold magenta]All Products[/bold magenta]", style="magenta")

        self.console.print()

        conn, cursor = self.get_connection()
        try:
            cursor.execute("""
                SELECT product_id, sku, product_name, price, stock_quantity
                FROM products
                ORDER BY product_id
            """)
            rows = cursor.fetchall()
        finally:
            conn.close()

        if not rows:
            self.console.print("[red]No products found.[/red]")
        else:
            table = Table(title="Products", show_lines=True)
            table.add_column("ID", justify="right")
            table.add_column("SKU")
            table.add_column("Name")
            table.add_column("Price", justify="right")
            table.add_column("Stock", justify="right")

            for row in rows:
                table.add_row(str(row[0]), row[1], row[2], f"${row[3]:.2f}", str(row[4]))

            self.console.print(table)

        self._pause()

    def delete_product(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Delete Product[/bold magenta]", style="magenta")

        self.console.print()

        product_id = IntPrompt.ask("Enter product ID to delete")

        confirm = Confirm.ask("Are you sure you want to delete this product?", default=False)
        if not confirm:
            self.console.print("[yellow]Delete cancelled.[/yellow]")
            self._pause()
            return

        conn, cursor = self.get_connection()
        try:
            cursor.execute("DELETE FROM products WHERE product_id = ?", (product_id,))
            conn.commit()

            if cursor.rowcount == 0:
                self.console.print("[yellow]No product found with that ID.[/yellow]")
            else:
                self.console.print("[bold green]Product deleted successfully.[/bold green]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def update_product_stock(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Update Product Stock[/bold magenta]", style="magenta")

        self.console.print()
        product_id = IntPrompt.ask("Product ID")
        stock_quantity = IntPrompt.ask("New stock quantity")

        if stock_quantity < 0:
            self.console.print("[red]Stock quantity cannot be negative.[/red]")
            self._pause()
            return

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                UPDATE products
                SET stock_quantity = ?
                WHERE product_id = ?
                """,
                (stock_quantity, product_id),
            )
            conn.commit()

            if cursor.rowcount == 0:
                self.console.print("[yellow]No product found with that ID.[/yellow]")
            else:
                self.console.print("[bold green]Stock updated successfully.[/bold green]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def add_category(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Add Category[/bold magenta]", style="magenta")

        self.console.print()
        category_name = Prompt.ask("Category name").strip()

        if not category_name:
            self.console.print("[red]Category name cannot be empty.[/red]")
            self._pause()
            return

        if len(category_name) > 50:
            self.console.print("[red]Category name must be 50 characters or fewer.[/red]")
            self._pause()
            return

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                SELECT 1
                FROM categories
                WHERE LOWER(category_name) = LOWER(?)
                LIMIT 1
                """,
                (category_name,),
            )
            if cursor.fetchone() is not None:
                self.console.print("[yellow]That category already exists.[/yellow]")
                self._pause()
                return

            cursor.execute(
                """
                INSERT INTO categories (category_name)
                VALUES (?)
                """,
                (category_name,),
            )
            conn.commit()
            self.console.print("[bold green]Category added successfully.[/bold green]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def view_categories(self):
        self._clear_screen()
        self.console.rule("[bold magenta]All Categories[/bold magenta]", style="magenta")

        self.console.print()

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                SELECT category_id, category_name
                FROM categories
                ORDER BY category_name
                """
            )
            rows = cursor.fetchall()
        finally:
            conn.close()

        if not rows:
            self.console.print("[red]No categories found.[/red]")
        else:
            table = Table(title="Categories", show_lines=True)
            table.add_column("ID", justify="right")
            table.add_column("Category Name")

            for row in rows:
                table.add_row(str(row[0]), row[1])

            self.console.print(table)

        self._pause()

    def create_order(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Create Order[/bold magenta]", style="magenta")
        self.console.print()

        conn, cursor = self.get_connection()
        try:
            customer_id = IntPrompt.ask("Customer ID")

            cursor.execute(
                """
                SELECT first_name, last_name
                FROM customers
                WHERE customer_id = ?
                """,
                (customer_id,),
            )
            customer = cursor.fetchone()
            if customer is None:
                self.console.print("[red]Customer not found.[/red]")
                self._pause()
                return

            self.console.print(
                f"Creating order for [bold]{customer[0]} {customer[1]}[/bold] (ID {customer_id})"
            )

            order_lines = []
            while True:
                product_id = IntPrompt.ask("Product ID")
                quantity = IntPrompt.ask("Quantity")

                if quantity <= 0:
                    self.console.print("[red]Quantity must be greater than 0.[/red]")
                    continue

                cursor.execute(
                    """
                    SELECT product_name, price, stock_quantity
                    FROM products
                    WHERE product_id = ?
                    """,
                    (product_id,),
                )
                product = cursor.fetchone()

                if product is None:
                    self.console.print("[red]Product not found.[/red]")
                    continue

                if product[2] < quantity:
                    self.console.print(
                        f"[red]Not enough stock for {product[0]} (available: {product[2]}).[/red]"
                    )
                    continue

                order_lines.append(
                    {
                        "product_id": product_id,
                        "product_name": product[0],
                        "item_price": product[1],
                        "quantity": quantity,
                    }
                )

                if not Confirm.ask("Add another product?", default=False):
                    break

            if not order_lines:
                self.console.print("[yellow]No items added. Order cancelled.[/yellow]")
                self._pause()
                return

            total_amount = sum(line["item_price"] * line["quantity"] for line in order_lines)
            order_date = date.today().isoformat()

            cursor.execute(
                """
                INSERT INTO orders (customer_id, order_date, total_amount)
                VALUES (?, ?, ?)
                """,
                (customer_id, order_date, total_amount),
            )
            order_id = cursor.lastrowid

            for line in order_lines:
                cursor.execute(
                    """
                    INSERT INTO order_items (order_id, product_id, quantity, item_price)
                    VALUES (?, ?, ?, ?)
                    """,
                    (order_id, line["product_id"], line["quantity"], line["item_price"]),
                )
                cursor.execute(
                    """
                    UPDATE products
                    SET stock_quantity = stock_quantity - ?
                    WHERE product_id = ?
                    """,
                    (line["quantity"], line["product_id"]),
                )

            conn.commit()
            self.console.print(
                f"[bold green]Order #{order_id} created successfully. Total: ${total_amount:.2f}[/bold green]"
            )
        except sqlite3.Error as e:
            conn.rollback()
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def view_orders(self):
        self._clear_screen()
        self.console.rule("[bold magenta]All Orders[/bold magenta]", style="magenta")
        self.console.print()

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                SELECT
                    o.order_id,
                    o.order_date,
                    c.first_name || ' ' || c.last_name AS customer_name,
                    COALESCE(o.total_amount, 0),
                    COALESCE(SUM(oi.quantity), 0) AS total_items
                FROM orders o
                JOIN customers c ON c.customer_id = o.customer_id
                LEFT JOIN order_items oi ON oi.order_id = o.order_id
                GROUP BY o.order_id, o.order_date, customer_name, o.total_amount
                ORDER BY o.order_id DESC
                """
            )
            rows = cursor.fetchall()
        finally:
            conn.close()

        if not rows:
            self.console.print("[red]No orders found.[/red]")
        else:
            table = Table(title="Orders", show_lines=True)
            table.add_column("Order ID", justify="right")
            table.add_column("Order Date")
            table.add_column("Customer")
            table.add_column("Items", justify="right")
            table.add_column("Total", justify="right")

            for row in rows:
                table.add_row(str(row[0]), row[1], row[2], str(row[4]), f"${row[3]:.2f}")

            self.console.print(table)

        self._pause()

    def report_low_stock(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Low Stock Report[/bold magenta]", style="magenta")
        self.console.print()

        threshold = IntPrompt.ask("Show products with stock at or below", default=5)

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                SELECT product_id, sku, product_name, stock_quantity
                FROM products
                WHERE stock_quantity <= ?
                ORDER BY stock_quantity ASC, product_name ASC
                """,
                (threshold,),
            )
            rows = cursor.fetchall()
        finally:
            conn.close()

        if not rows:
            self.console.print("[green]No low-stock products found.[/green]")
        else:
            table = Table(title="Low Stock", show_lines=True)
            table.add_column("ID", justify="right")
            table.add_column("SKU")
            table.add_column("Name")
            table.add_column("Stock", justify="right")

            for row in rows:
                table.add_row(str(row[0]), row[1], row[2], str(row[3]))

            self.console.print(table)

        self._pause()

    def report_top_products(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Top Selling Products[/bold magenta]", style="magenta")
        self.console.print()

        limit = IntPrompt.ask("How many products to show", default=5)

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                SELECT
                    p.product_id,
                    p.product_name,
                    COALESCE(SUM(oi.quantity), 0) AS units_sold,
                    COALESCE(SUM(oi.quantity * oi.item_price), 0) AS revenue
                FROM products p
                LEFT JOIN order_items oi ON oi.product_id = p.product_id
                GROUP BY p.product_id, p.product_name
                ORDER BY units_sold DESC, revenue DESC, p.product_name ASC
                LIMIT ?
                """,
                (limit,),
            )
            rows = cursor.fetchall()
        finally:
            conn.close()

        if not rows:
            self.console.print("[red]No products found.[/red]")
        else:
            table = Table(title="Top Sellers", show_lines=True)
            table.add_column("Product ID", justify="right")
            table.add_column("Product")
            table.add_column("Units Sold", justify="right")
            table.add_column("Revenue", justify="right")

            for row in rows:
                table.add_row(str(row[0]), row[1], str(row[2]), f"${row[3]:.2f}")

            self.console.print(table)

        self._pause()

    def report_customer_spend(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Customer Spend[/bold magenta]", style="magenta")
        self.console.print()

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                SELECT
                    c.customer_id,
                    c.first_name || ' ' || c.last_name AS customer_name,
                    COUNT(o.order_id) AS order_count,
                    COALESCE(SUM(o.total_amount), 0) AS total_spend
                FROM customers c
                LEFT JOIN orders o ON o.customer_id = c.customer_id
                GROUP BY c.customer_id, customer_name
                ORDER BY total_spend DESC, customer_name ASC
                """
            )
            rows = cursor.fetchall()
        finally:
            conn.close()

        if not rows:
            self.console.print("[red]No customers found.[/red]")
        else:
            table = Table(title="Customer Spend", show_lines=True)
            table.add_column("Customer ID", justify="right")
            table.add_column("Customer")
            table.add_column("Orders", justify="right")
            table.add_column("Total Spend", justify="right")

            for row in rows:
                table.add_row(str(row[0]), row[1], str(row[2]), f"${row[3]:.2f}")

            self.console.print(table)

        self._pause()


if __name__ == "__main__":
    app = GroceryApp()
    app.run()