import sys

def solve():
    # Fast I/O for competitive programming
    input_data = sys.stdin.read().split()
    if not input_data:
        return
        
    N = int(input_data[0])
    memo = {}
    
    def get_min_moves(n):
        # Base case: 0 moves required to reach 1 soldier
        if n == 1:
            return 0
            
        # Return already computed minimal moves for a given state
        if n in memo:
            return memo[n]
            
        # Option 1: Subtract 1 consecutively until we reach 1
        res = n - 1 
        
        # Option 2: Subtract to the nearest multiple of 2, then divide by 2
        res = min(res, n % 2 + 1 + get_min_moves(n // 2))
        
        # Option 3: Subtract to the nearest multiple of 3, then divide by 3
        res = min(res, n % 3 + 1 + get_min_moves(n // 3))
        
        memo[n] = res
        return res
        
    print(get_min_moves(N))

if __name__ == '__main__':
    # Increase recursion depth to be safe, though max depth for N=10^9 is minimal
    sys.setrecursionlimit(2000)
    solve()