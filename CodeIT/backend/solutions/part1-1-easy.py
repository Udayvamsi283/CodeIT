import sys

def solve():
    # Fast I/O
    input_data = sys.stdin.read().split()
    if not input_data:
        return
        
    n = int(input_data[0])
    m = int(input_data[1])
    
    v = [int(x) for x in input_data[2:2+n]]
    d = [int(x) for x in input_data[2+n:2+2*n]]
    
    # Returns the total number of meals we can eat that yield at least 'x' taste points
    def count_meals(x):
        cnt = 0
        for i in range(n):
            if v[i] >= x:
                cnt += (v[i] - x) // d[i] + 1
        return cnt
        
    # Binary search for the optimal taste point threshold
    low = 0
    high = max(v) if v else 0
    ans_x = 0
    
    while low <= high:
        mid = (low + high) // 2
        # If we can get m or more meals at this threshold, try a higher threshold
        if count_meals(mid) >= m:
            ans_x = mid
            low = mid + 1
        else:
            high = mid - 1
            
    total_taste = 0
    meals_taken = 0
    
    # Sum the arithmetic progression for all meals strictly greater than our threshold
    for i in range(n):
        if v[i] > ans_x:
            k = (v[i] - (ans_x + 1)) // d[i] + 1
            total_taste += k * v[i] - d[i] * k * (k - 1) // 2
            meals_taken += k
            
    # Pad the remaining allowed meals with the exact threshold value
    if ans_x > 0:
        remaining = m - meals_taken
        total_taste += remaining * ans_x
        
    print(total_taste)

if __name__ == '__main__':
    solve()