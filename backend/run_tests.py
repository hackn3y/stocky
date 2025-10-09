"""
Comprehensive API testing script
This script will help test all endpoints manually
"""

import requests
import json
import time
import sys

API_URL = "http://localhost:5000/api"

def print_header(text):
    """Print a formatted header"""
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70)

def print_test(name, status="RUNNING"):
    """Print test status"""
    symbols = {"RUNNING": "⏳", "PASS": "✓", "FAIL": "✗"}
    print(f"\n{symbols.get(status, '•')} {name}")

def test_endpoint(name, url, method='GET', data=None, expected_status=200):
    """Test an API endpoint"""
    print_test(name, "RUNNING")

    try:
        if method == 'GET':
            response = requests.get(url, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=10)

        success = response.status_code == expected_status

        print(f"  URL: {url}")
        print(f"  Method: {method}")
        print(f"  Status: {response.status_code} (Expected: {expected_status})")

        try:
            json_data = response.json()
            print(f"  Response Preview:")
            # Pretty print first few fields
            if isinstance(json_data, dict):
                for key, value in list(json_data.items())[:5]:
                    if isinstance(value, (str, int, float, bool)):
                        print(f"    {key}: {value}")
                    elif isinstance(value, dict):
                        print(f"    {key}: {{...}}")
                    elif isinstance(value, list):
                        print(f"    {key}: [...] ({len(value)} items)")
        except:
            print(f"  Response: {response.text[:100]}")

        if success:
            print_test(name, "PASS")
        else:
            print_test(name, "FAIL")

        return success, response

    except requests.exceptions.ConnectionError:
        print("  ERROR: Could not connect to server")
        print("  Make sure the Flask server is running (python app.py)")
        print_test(name, "FAIL")
        return False, None
    except Exception as e:
        print(f"  ERROR: {str(e)}")
        print_test(name, "FAIL")
        return False, None

def main():
    print_header("Stock Prediction API - Comprehensive Test Suite")

    print("\n📋 Pre-flight Check:")
    print("  • Server should be running on http://localhost:5000")
    print("  • Model should be trained (spy_model.pkl exists)")
    print("  • Internet connection needed for yfinance")

    input("\n▶ Press Enter to start testing (Ctrl+C to cancel)...")

    results = []

    # Test 1: Health Check
    print_header("Test 1: Health Check")
    success, response = test_endpoint(
        "Health Check",
        f"{API_URL}/health"
    )
    results.append(("Health Check", success))

    # Test 2: Model Info
    print_header("Test 2: Model Information")
    success, response = test_endpoint(
        "Model Info",
        f"{API_URL}/model/info"
    )
    results.append(("Model Info", success))

    # Test 3: Predict SPY
    print_header("Test 3: Single Prediction (SPY)")
    success, response = test_endpoint(
        "Predict SPY",
        f"{API_URL}/predict/SPY"
    )
    results.append(("Predict SPY", success))
    if success and response:
        data = response.json()
        if data.get('success'):
            print(f"\n  📊 Prediction Details:")
            print(f"     Symbol: {data.get('symbol')}")
            print(f"     Prediction: {data.get('prediction')}")
            print(f"     Confidence: {data.get('confidence')}%")
            print(f"     Current Price: ${data.get('current_price')}")

    # Test 4: Predict another symbol
    print_header("Test 4: Single Prediction (QQQ)")
    success, response = test_endpoint(
        "Predict QQQ",
        f"{API_URL}/predict/QQQ"
    )
    results.append(("Predict QQQ", success))

    # Test 5: Historical data - 1 month
    print_header("Test 5: Historical Data (1 month, daily)")
    success, response = test_endpoint(
        "Historical SPY 1M",
        f"{API_URL}/historical/SPY?period=1mo&interval=1d"
    )
    results.append(("Historical 1M", success))
    if success and response:
        data = response.json()
        if data.get('success'):
            print(f"\n  📈 Data Summary:")
            print(f"     Data Points: {data.get('data_points')}")
            print(f"     Period: {data.get('period')}")
            print(f"     Interval: {data.get('interval')}")

    # Test 6: Historical data - 1 year
    print_header("Test 6: Historical Data (1 year, weekly)")
    success, response = test_endpoint(
        "Historical SPY 1Y",
        f"{API_URL}/historical/SPY?period=1y&interval=1wk"
    )
    results.append(("Historical 1Y", success))

    # Test 7: Stock Info
    print_header("Test 7: Stock Information")
    success, response = test_endpoint(
        "Stock Info SPY",
        f"{API_URL}/info/SPY"
    )
    results.append(("Stock Info", success))
    if success and response:
        data = response.json()
        if data.get('success'):
            info = data.get('info', {})
            print(f"\n  ℹ️  Stock Details:")
            print(f"     Name: {info.get('name')}")
            print(f"     Exchange: {info.get('exchange')}")
            print(f"     Currency: {info.get('currency')}")

    # Test 8: Batch Predictions
    print_header("Test 8: Batch Predictions")
    success, response = test_endpoint(
        "Batch Predictions",
        f"{API_URL}/predict/batch",
        method='POST',
        data={"symbols": ["SPY", "QQQ", "VOO"]}
    )
    results.append(("Batch Predictions", success))
    if success and response:
        data = response.json()
        if data.get('success'):
            print(f"\n  📦 Batch Results:")
            for pred in data.get('predictions', []):
                print(f"     {pred['symbol']}: {pred['prediction']} ({pred['confidence']:.1f}%)")

    # Test 9: List Assets
    print_header("Test 9: List Supported Assets")
    success, response = test_endpoint(
        "List Assets",
        f"{API_URL}/assets"
    )
    results.append(("List Assets", success))

    # Test 10: Error Handling - Invalid Symbol
    print_header("Test 10: Error Handling (Invalid Symbol)")
    success, response = test_endpoint(
        "Invalid Symbol",
        f"{API_URL}/predict/INVALID123XYZ",
        expected_status=400
    )
    results.append(("Error Handling", success))

    # Test 11: Error Handling - Invalid Endpoint
    print_header("Test 11: Error Handling (404)")
    success, response = test_endpoint(
        "Invalid Endpoint",
        f"{API_URL}/nonexistent",
        expected_status=404
    )
    results.append(("404 Handling", success))

    # Summary
    print_header("Test Summary")

    passed = sum(1 for _, success in results if success)
    failed = len(results) - passed

    print(f"\n  Total Tests: {len(results)}")
    print(f"  ✓ Passed: {passed}")
    print(f"  ✗ Failed: {failed}")
    print(f"  Success Rate: {(passed/len(results)*100):.1f}%")

    print("\n  Test Results:")
    for name, success in results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"    {status:8} - {name}")

    if failed == 0:
        print("\n  🎉 All tests passed! API is working correctly.")
        print("  ✅ Ready for Phase 3: React Frontend")
    else:
        print(f"\n  ⚠️  {failed} test(s) failed. Review errors above.")

    print("\n" + "="*70 + "\n")

    return failed == 0

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Tests cancelled by user")
        sys.exit(1)
