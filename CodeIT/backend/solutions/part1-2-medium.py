import sys

def solve():
    # Read all inputs from standard input at once
    input_data = sys.stdin.read().split()
    if not input_data:
        return
        
    n = int(input_data[0])
    k = int(input_data[1])
    a = [int(x) for x in input_data[2:n+2]]
    
    max_mss = float('-inf')
    
    # Check all possible subarrays O(N^2)
    for i in range(n):
        for j in range(i, n):
            # Extract elements inside and outside the current subarray
            sub = a[i:j+1]
            out = a[:i] + a[j+1:]
            
            # Sort to easily identify the smallest inside and largest outside elements
            sub.sort()
            out.sort(reverse=True)
            
            current_sum = sum(sub)
            
            # Perform up to 'k' greedy swaps where it is mathematically beneficial
            swaps = min(k, len(sub), len(out))
            for x in range(swaps):
                if out[x] > sub[x]:
                    current_sum += out[x] - sub[x]
                else:
                    break  # Stop early if outside elements are no longer strictly greater
                    
            if current_sum > max_mss:
                max_mss = current_sum
                
    print(max_mss)

if __name__ == '__main__':
    solve()