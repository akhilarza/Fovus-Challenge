import sys

input_text = sys.argv[1]
input_file = sys.argv[2]
file1 = open(input_file, "a")
file1.write(input_text + "\n")
file1.close()
