import sys
from collections import defaultdict

def solve():
    # Fast I/O for competitive programming
    input_data = sys.stdin.read().split()
    if not input_data:
        return
        
    N = int(input_data[0])
    k = int(input_data[1])
    A = [int(x) for x in input_data[2:2+N]]
    
    max_sum = 0
    current_sum = 0
    counts = defaultdict(int)
    l = 0
    
    for r in range(N):
        counts[A[r]] += 1
        current_sum += A[r]
        
        # Shrink the window if distinct elements exceed k or if the left element is negative
        while len(counts) > k or (l <= r and A[l] < 0):
            counts[A[l]] -= 1
            if counts[A[l]] == 0:
                del counts[A[l]]
            current_sum -= A[l]
            l += 1
            
        if len(counts) <= k:
            max_sum = max(max_sum, current_sum)
            
    print(max_sum)

if __name__ == '__main__':
    solve()