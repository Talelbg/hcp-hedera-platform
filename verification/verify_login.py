from playwright.sync_api import sync_playwright

def verify_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Using port 3001 as per logs
        try:
            page.goto("http://localhost:3001/login")
            page.wait_for_selector("text=Sign in", timeout=5000)
            page.screenshot(path="verification/login_page.png")
            print("Login page screenshot taken")
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")

        browser.close()

if __name__ == "__main__":
    verify_dashboard()
