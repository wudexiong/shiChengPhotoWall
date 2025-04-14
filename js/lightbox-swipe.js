/**
 * Lightbox扩展 - 添加滑动切换功能
 * 此脚本为Lightbox.js添加触摸滑动支持
 */
(function($) {
    // 等待文档加载完成
    $(document).ready(function() {
        // 变量声明
        var startX, startY, endX, endY;
        var minSwipeDistance = 50; // 最小滑动距离，单位：像素
        var maxSwipeTime = 500;    // 最大滑动时间，单位：毫秒
        var startTime, endTime;    // 记录滑动开始和结束时间
        var isSwipeValid = false;  // 是否是有效的滑动操作

        // 在document加载后，等待lightbox初始化
        setTimeout(function() {
            // 获取lightbox元素
            var $lightbox = $('#lightbox');
            var $overlay = $('#lightboxOverlay');
            
            if (!$lightbox.length) {
                console.log('Lightbox元素未找到，滑动切换功能未启用。');
                return;
            }

            // 触摸开始事件
            $lightbox.on('touchstart', function(e) {
                var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                startX = touch.pageX;
                startY = touch.pageY;
                startTime = new Date().getTime();
                isSwipeValid = true;
            });

            // 触摸移动事件
            $lightbox.on('touchmove', function(e) {
                // 阻止页面滚动
                if (isSwipeValid) {
                    e.preventDefault();
                }
            });

            // 触摸结束事件
            $lightbox.on('touchend', function(e) {
                if (!isSwipeValid) return;
                
                var touch = e.originalEvent.changedTouches[0];
                endX = touch.pageX;
                endY = touch.pageY;
                endTime = new Date().getTime();
                
                // 计算水平和垂直的移动距离
                var deltaX = endX - startX;
                var deltaY = endY - startY;
                
                // 计算滑动时间
                var swipeTime = endTime - startTime;
                
                // 如果滑动时间过长则忽略
                if (swipeTime > maxSwipeTime) {
                    return;
                }
                
                // 确保是水平滑动（水平距离大于垂直距离）
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // 滑动距离必须大于最小滑动距离
                    if (Math.abs(deltaX) > minSwipeDistance) {
                        // 向右滑动 -> 显示前一张图片
                        if (deltaX > 0) {
                            $('.lb-prev').click();
                        } 
                        // 向左滑动 -> 显示下一张图片
                        else {
                            $('.lb-next').click();
                        }
                    }
                }
                
                isSwipeValid = false;
            });

            // 触摸取消事件
            $lightbox.on('touchcancel', function() {
                isSwipeValid = false;
            });
            
            console.log('Lightbox滑动切换功能已启用。');
        }, 1000); // 给Lightbox足够的初始化时间
    });
})(jQuery); 