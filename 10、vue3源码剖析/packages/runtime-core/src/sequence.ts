


//  [5, 3, 4, 0]    => [1,2]

// 从一个序列中找到最长递增子序列的个数  
// 贪心算法，找更有潜力的



// 2 3 7 6 8 4 9 5


// 以2 开头开始算
// 2 3
// 2 3 7
// 2 3 6     
// 2 3 6 8
// 2 3 4 8   
// 2 3 4 8  9
// 2 3 4 8  9   ==  5
// 0 1 5  4  6

// 当前和和序列的最后一项比较，如果比最后一项大，直接追加到尾部，如果比尾部小，则找到序列中比他当前大的替换掉
// 个数没问题，那么最后 在把序列弄对了就好
// 采用二分查找 找比当前项大的那个人


// [1,2,3,4,5] => [0,1,2,3,4]

 //掌握思想即可 = 默认后追添加 + 贪心替换 + 追溯

function getSequence(arr) {
    let len = arr.length
    let result = [0];
    let p = new Array(len).fill(0); // p 中存的是什么目前不重要
    let lastIndex;
    let start
    let end
    let middle;
    for (let i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) { // 0在vue3中意味着新增节点，这个不计入最长递增子序列列表
            lastIndex = result[result.length - 1]; // 去到数组中的最后一项，就是最大的那个索引
            if (arr[lastIndex] < arrI) { // 说明当前这一项比结果集中最后一项大则直接将索引放入即可
                p[i] = lastIndex; // 存的是索引
                result.push(i);
                continue
            }
            // 否则的情况
            start = 0;
            end = result.length - 1; // 二分查找
            while (start < end) { // 计算有序比较都可以这样搞
                middle = Math.floor(((start + end) / 2));
                if (arr[result[middle]] < arrI) {
                    start = middle + 1;
                } else {
                    end = middle
                }
            }
            if (arrI < arr[result[end]]) {
                p[i] = result[end - 1]
                result[end] = i
            }

        }
    }
    // 倒叙追溯 先取到结果集中的最后一个 
    let i = result.length;
    let last = result[i - 1];

    while (i-- > 0) { // 当检索后停止
        result[i] = last; // 最后一项是正确的 
        last = p[last]; // 根据最后一项 向前追溯
    }
    return result
}

// 2 3 5 7 9    4

// 2 3 8 7    6 8 4 9 5
// 2 3 7 

let arrIndex = getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4])
//                          
// 2 ,3 ,7 ,6, 8 ,4 ,9, 5
// 2
// 2 3 
// 2 3 7
// 2 3 6
// 2 3 6 8
// 2 3 4 8
// 2 3 4 8 9 
// 2 3 4 5 9
// 0 1 5 7 6



console.log(arrIndex)