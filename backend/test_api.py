"""
Simple script to test the Flask API endpoints
Run this after starting the Flask server with: python app.py
"""

import requests
import json

API_URL = "http://localhost:5000/api"

def test_endpoint(name, url, method='GET', data=None):
    """Test an API endpoint and print the result"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    print('='*60)

    try:
        if method == 'GET':
            response = requests.get(url, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=10)

        print(f"Status Code: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2))

        return response.status_code == 200

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False


def main():
    print("\n" + "="*60)
    print("Stock Prediction API Test Suite")
    print("="*60)

    results = []

    # Test 1: Health check
    results.append(test_endpoint(
        "Health Check",
        f"{API_URL}/health"
    ))

    # Test 2: Model info
    results.append(test_endpoint(
        "Model Information",
        f"{API_URL}/model/info"
    ))

    # Test 3: Predict SPY
    results.append(test_endpoint(
        "Predict SPY",
        f"{API_URL}/predict/SPY"
    ))

    # Test 4: Historical data
    results.append(test_endpoint(
        "Historical Data (SPY, 1 month)",
        f"{API_URL}/historical/SPY?period=1mo&interval=1d"
    ))

    # Test 5: Stock info
    results.append(test_endpoint(
        "Stock Info (SPY)",
        f"{API_URL}/info/SPY"
    ))

    # Test 6: Batch predictions
    results.append(test_endpoint(
        "Batch Predictions",
        f"{API_URL}/predict/batch",
        method='POST',
        data={"symbols": ["SPY", "QQQ", "VOO"]}
    ))

    # Test 7: List assets
    results.append(test_endpoint(
        "List Supported Assets",
        f"{API_URL}/assets"
    ))

    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    print(f"Total tests: {len(results)}")
    print(f"Passed: {sum(results)}")
    print(f"Failed: {len(results) - sum(results)}")

    if all(results):
        print("\n✓ All tests passed!")
    else:
        print("\n✗ Some tests failed")

    print("="*60 + "\n")


if __name__ == "__main__":
    print("\nMake sure the Flask server is running (python app.py)")
    input("Press Enter to start testing...")
    main()
