"""
Quick test to verify Flask server is accessible
Run this while the server is running in another terminal
"""

import requests
import sys

def test_connection():
    """Test if server is accessible"""
    try:
        print("Testing connection to Flask server...")
        print("URL: http://localhost:5000/api/health")

        response = requests.get("http://localhost:5000/api/health", timeout=5)

        if response.status_code == 200:
            data = response.json()
            print("\n✓ SUCCESS! Server is running!")
            print(f"  Status: {data.get('status')}")
            print(f"  Version: {data.get('version')}")
            print(f"  Timestamp: {data.get('timestamp')}")

            # Quick prediction test
            print("\nTesting prediction endpoint...")
            pred_response = requests.get("http://localhost:5000/api/predict/SPY", timeout=10)

            if pred_response.status_code == 200:
                pred_data = pred_response.json()
                if pred_data.get('success'):
                    print(f"\n✓ Prediction works!")
                    print(f"  Symbol: {pred_data.get('symbol')}")
                    print(f"  Prediction: {pred_data.get('prediction')}")
                    print(f"  Confidence: {pred_data.get('confidence')}%")
                    print(f"  Price: ${pred_data.get('current_price')}")

                    print("\n" + "="*50)
                    print("✅ API is working correctly!")
                    print("="*50)
                    print("\nYou can now:")
                    print("  1. Run full tests: python run_tests.py")
                    print("  2. Access API at: http://localhost:5000")
                    print("  3. Move to Phase 3: React Frontend")
                    return True
                else:
                    print(f"\n✗ Prediction failed: {pred_data.get('error')}")
                    return False
            else:
                print(f"\n✗ Prediction endpoint returned status {pred_response.status_code}")
                return False
        else:
            print(f"\n✗ Server returned status {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Could not connect to server")
        print("\nMake sure the Flask server is running:")
        print("  1. Open a terminal")
        print("  2. cd backend")
        print("  3. python app.py")
        print("\nThen run this test again.")
        return False

    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    print("="*50)
    print("Flask API Quick Test")
    print("="*50 + "\n")

    success = test_connection()
    sys.exit(0 if success else 1)
