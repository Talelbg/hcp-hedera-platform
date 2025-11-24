from playwright.sync_api import sync_playwright

def verify_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant permissions to allow clipboard or others if needed
        context = browser.new_context()
        page = context.new_page()

        # 1. Login
        try:
            page.goto("http://localhost:3001/login")
            # Wait for login page
            page.wait_for_selector("text=Sign in", timeout=5000)

            # Since we can't easily login with real firebase auth in this environment,
            # We will verify the LOGIN page structure is correct,
            # AND verify the Codebase compiles.
            # However, I want to see the dashboard.
            # I can inject a script to bypass the ProtectedRoute in the browser? No, React state is internal.
            # I will modify the App.tsx temporarily to allow access to /dashboard without auth for verification.

            print("Login page load success.")
            page.screenshot(path="verification/login_page_v2.png")

        except Exception as e:
            print(f"Error during login verification: {e}")
            page.screenshot(path="verification/error_login.png")

        browser.close()

if __name__ == "__main__":
    verify_dashboard()
