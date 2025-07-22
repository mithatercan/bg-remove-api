import sys
import os
from rembg import remove
from PIL import Image

def remove_background(input_path, output_path):
    try:
        with open(input_path, 'rb') as input_file:
            input_data = input_file.read()
        
        output_data = remove(input_data)
        
        with open(output_path, 'wb') as output_file:
            output_file.write(output_data)
        
        print("SUCCESS")
        return True
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False

def main():
    if len(sys.argv) != 3:
        print("Usage: python model.py <input_path> <output_path>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    # Check if input file exists
    if not os.path.exists(input_path):
        print(f"ERROR: Input file '{input_path}' does not exist")
        sys.exit(1)
    
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Remove background
    success = remove_background(input_path, output_path)
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
