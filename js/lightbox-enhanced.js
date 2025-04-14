/**
 * Lightbox增强版 - 强化图片预加载功能
 * 此脚本通过增强Lightbox.js的预加载功能，确保在查看上一张或下一张图片时不会出现白屏
 * 主要实现：先显示小图，等大图加载完成后替换，同时预加载上一张和下一张图片
 */
(function() {
    // 确保jQuery存在
    var $ = window.jQuery || window.$;
    if (!$) {
        console.error('未找到jQuery，Lightbox增强功能无法启用');
        return;
    }
    
    // 等待文档加载完成
    $(document).ready(function() {
        // 图片缓存对象
        var imageCache = {};
        
        // 预加载队列和当前加载状态
        var preloadQueue = [];
        var isLoading = false;
        
        // 存储小图URL到大图URL的映射关系
        var thumbnailToLargeMap = {};
        // 存储大图URL到小图URL的映射关系
        var largeToThumbnailMap = {};
        
        // 等待Lightbox初始化
        setTimeout(function() {
            try {
                // 创建小图到大图的映射
                createThumbnailMapping();
                // 增强Lightbox功能
                enhanceLightbox();
                // 预加载所有的小图
                preloadAllThumbnails();
            } catch (e) {
                console.error('初始化Lightbox增强功能时出错:', e);
            }
        }, 1000);
        
        /**
         * 创建小图到大图的映射关系
         */
        function createThumbnailMapping() {
            // 查找所有照片墙中的图片链接
            $('a[data-lightbox], a[rel^=lightbox]').each(function() {
                var $link = $(this);
                var largeImageUrl = $link.attr('href');
                var $thumbnail = $link.find('img');
                
                if ($thumbnail.length && largeImageUrl) {
                    var thumbnailUrl = $thumbnail.attr('src');
                    thumbnailToLargeMap[largeImageUrl] = thumbnailUrl;
                    largeToThumbnailMap[thumbnailUrl] = largeImageUrl;
                    
                    // 在链接上存储缩略图信息，便于快速访问
                    $link.data('thumbnail-url', thumbnailUrl);
                }
            });
            
            console.log('创建了 ' + Object.keys(thumbnailToLargeMap).length + ' 个小图到大图的映射');
        }
        
        /**
         * 预加载所有缩略图
         */
        function preloadAllThumbnails() {
            console.log('开始预加载所有缩略图');
            for (var largeUrl in thumbnailToLargeMap) {
                var thumbUrl = thumbnailToLargeMap[largeUrl];
                if (thumbUrl) {
                    var img = new Image();
                    img.src = thumbUrl;
                }
            }
        }
        
        /**
         * 增强Lightbox功能
         */
        function enhanceLightbox() {
            // 修改Lightbox原型，增加小图支持
            extendLightboxPrototype();
            
            // 监听Lightbox打开事件
            $(document).on('click', 'a[data-lightbox], a[rel^=lightbox]', function() {
                var clickedUrl = $(this).attr('href');
                var thumbnailUrl = $(this).data('thumbnail-url');
                
                // 立即将点击的图片加入缓存
                if (thumbnailUrl) {
                    cacheImage(thumbnailUrl, false);
                }
                
                setTimeout(function() {
                    // 获取当前相册中的所有图片
                    var album = getLightboxAlbum();
                    if (album && album.length > 0) {
                        // 为每个相册项添加缩略图信息
                        enrichAlbumWithThumbnails(album);
                        // 预加载当前相册中的所有图片
                        preloadAlbumImages(album);
                    }
                }, 100);
            });
            
            // 监听图片导航事件
            $(document).on('click', '.lb-prev, .lb-next', function() {
                // 确保不会因为图片加载而出现白屏
                setTimeout(function() {
                    ensureNoWhiteScreen();
                }, 10);
            });
            
            // 监听键盘事件
            $(document).on('keydown', function(e) {
                // 左右箭头键
                if (e.keyCode === 37 || e.keyCode === 39) {
                    setTimeout(function() {
                        ensureNoWhiteScreen();
                    }, 10);
                }
            });
            
            // 增强原生的changeImage方法
            enhanceChangeImageMethod();
            
            console.log('Lightbox增强预加载功能已启用，支持先显示小图再加载大图。');
        }
        
        /**
         * 扩展Lightbox原型
         */
        function extendLightboxPrototype() {
            var lightboxProto = getLightboxPrototype();
            if (!lightboxProto) return;
            
            // 保存原始方法
            var originalStartMethod = lightboxProto.start;
            
            // 重写start方法，在打开相册时添加缩略图信息
            if (originalStartMethod) {
                lightboxProto.start = function(element) {
                    // 调用原始方法
                    originalStartMethod.call(this, element);
                    
                    // 为相册添加缩略图信息
                    enrichAlbumWithThumbnails(this.album);
                    
                    // 确保不会出现白屏
                    setTimeout(function() {
                        ensureNoWhiteScreen();
                    }, 10);
                };
            }
        }
        
        /**
         * 获取Lightbox的原型对象
         */
        function getLightboxPrototype() {
            var lightbox = findLightboxInstance();
            if (lightbox) {
                // 尝试找到构造函数的原型
                var proto = Object.getPrototypeOf(lightbox);
                if (proto) return proto;
                
                // 如果找不到原型，尝试从实例中获取方法
                if (typeof lightbox.start === 'function') {
                    return lightbox;
                }
            }
            return null;
        }
        
        /**
         * 为相册条目添加缩略图信息
         */
        function enrichAlbumWithThumbnails(album) {
            if (!album) return;
            
            for (var i = 0; i < album.length; i++) {
                if (album[i] && album[i].link) {
                    // 添加缩略图URL
                    album[i].thumbnail = thumbnailToLargeMap[album[i].link];
                }
            }
        }
        
        /**
         * 获取当前Lightbox相册中的所有图片
         */
        function getLightboxAlbum() {
            // 在Lightbox对象中查找相册信息
            var lightboxInstance = findLightboxInstance();
            if (lightboxInstance && lightboxInstance.album) {
                return lightboxInstance.album;
            }
            return null;
        }
        
        /**
         * 查找页面中的Lightbox实例
         */
        function findLightboxInstance() {
            // 尝试在jQuery对象中查找Lightbox实例
            if ($.data) {
                var $lightbox = $('#lightbox');
                if ($lightbox.length) {
                    var data = $lightbox.data();
                    for (var key in data) {
                        if (data[key] && data[key].album) {
                            return data[key];
                        }
                    }
                }
            }
            
            // 尝试查找全局变量
            if (typeof window['Lightbox'] !== 'undefined') {
                // 如果Lightbox是一个全局对象，尝试获取实例
                if (window['Lightbox'].getInstance) {
                    return window['Lightbox'].getInstance();
                }
                return window['Lightbox'];
            }
            
            return null;
        }
        
        /**
         * 预加载相册中的所有图片
         */
        function preloadAlbumImages(album) {
            // 清空现有预加载队列
            preloadQueue = [];
            
            // 记录当前图片索引
            var currentIndex = getCurrentImageIndex();
            
            // 按照优先级顺序将图片添加到预加载队列
            if (currentIndex !== -1) {
                // 首先添加当前图片、前一张和后一张的缩略图(如果有)
                addThumbnailToPreloadQueue(album, currentIndex);
                addThumbnailToPreloadQueue(album, currentIndex - 1);
                addThumbnailToPreloadQueue(album, currentIndex + 1);
                
                // 然后添加当前图片、前一张和后一张的高清图
                addToPreloadQueue(album, currentIndex, 3);
                addToPreloadQueue(album, currentIndex - 1, 2);
                addToPreloadQueue(album, currentIndex + 1, 2);
                
                // 然后再添加其他图片
                for (var i = 0; i < album.length; i++) {
                    if (i !== currentIndex && i !== currentIndex - 1 && i !== currentIndex + 1) {
                        addToPreloadQueue(album, i, 1);
                    }
                }
            } else {
                // 如果不知道当前索引，将所有图片加入队列
                for (var i = 0; i < album.length; i++) {
                    addThumbnailToPreloadQueue(album, i);
                    addToPreloadQueue(album, i, 1);
                }
            }
            
            // 根据优先级排序预加载队列
            preloadQueue.sort(function(a, b) {
                return b.priority - a.priority;
            });
            
            // 开始预加载图片
            startPreloading();
        }
        
        /**
         * 将图片添加到预加载队列
         */
        function addToPreloadQueue(album, index, priority) {
            if (index >= 0 && index < album.length && album[index] && album[index].link) {
                preloadQueue.push({
                    src: album[index].link,
                    index: index,
                    priority: priority,
                    isThumbnail: false
                });
            }
        }
        
        /**
         * 将缩略图添加到预加载队列
         */
        function addThumbnailToPreloadQueue(album, index) {
            if (index >= 0 && index < album.length && album[index] && album[index].thumbnail) {
                // 缩略图始终最高优先级
                preloadQueue.push({
                    src: album[index].thumbnail,
                    index: index,
                    priority: 5,
                    isThumbnail: true
                });
            }
        }
        
        /**
         * 获取当前显示图片的索引
         */
        function getCurrentImageIndex() {
            var lightbox = findLightboxInstance();
            if (lightbox && typeof lightbox.currentImageIndex !== 'undefined') {
                return lightbox.currentImageIndex;
            }
            return -1;
        }
        
        /**
         * 开始预加载图片
         */
        function startPreloading() {
            if (isLoading || preloadQueue.length === 0) return;
            
            isLoading = true;
            var item = preloadQueue.shift();
            
            // 检查图片是否已经缓存
            if (imageCache[item.src]) {
                // 如果已缓存，继续下一张
                isLoading = false;
                startPreloading();
                return;
            }
            
            // 缓存图片
            cacheImage(item.src, item.isThumbnail, function() {
                // 如果当前正在显示这张图片，且不是缩略图，则立即替换
                if (!item.isThumbnail) {
                    var lightbox = findLightboxInstance();
                    if (lightbox && lightbox.currentImageIndex === item.index) {
                        replaceWithHighResImage(item.src);
                    }
                }
                
                // 继续加载下一张图片
                isLoading = false;
                startPreloading();
            });
        }
        
        /**
         * 缓存图片
         */
        function cacheImage(src, isThumbnail, callback) {
            // 如果已经缓存，直接返回
            if (imageCache[src]) {
                if (typeof callback === 'function') callback();
                return;
            }
            
            // 创建新图片对象进行预加载
            var img = new Image();
            
            img.onload = function() {
                // 缓存加载完成的图片
                imageCache[src] = {
                    width: img.width || 250,
                    height: img.height || 250,
                    element: img,
                    isThumbnail: isThumbnail
                };
                
                if (typeof callback === 'function') callback();
            };
            
            img.onerror = function() {
                console.error('图片加载失败: ' + src);
                if (typeof callback === 'function') callback();
            };
            
            // 开始加载图片
            img.src = src;
        }
        
        /**
         * 确保切换图片时不会出现白屏
         */
        function ensureNoWhiteScreen() {
            // 立即隐藏loading提示
            var $loader = $('.lb-loader');
            $loader.hide();
            
            var lightbox = findLightboxInstance();
            if (!lightbox) return;
            
            var currentIndex = lightbox.currentImageIndex;
            if (currentIndex === -1 || !lightbox.album) return;
            
            var currentSrc = lightbox.album[currentIndex].link;
            var thumbnailSrc = lightbox.album[currentIndex].thumbnail;
            
            // 检查当前图片是否已经缓存
            if (imageCache[currentSrc]) {
                // 已缓存，使用缓存的图片
                replaceWithHighResImage(currentSrc);
            } else {
                // 未缓存，先使用小图
                if (thumbnailSrc) {
                    showThumbnailImage(thumbnailSrc);
                }
                
                // 立即开始加载大图
                cacheImage(currentSrc, false, function() {
                    replaceWithHighResImage(currentSrc);
                });
            }
            
            // 立即预加载上一张和下一张
            preloadNeighborImages(currentIndex);
        }
        
        /**
         * 显示缩略图作为临时图片
         */
        function showThumbnailImage(thumbnailSrc) {
            if (!thumbnailSrc) return;
            
            var $image = $('.lb-image');
            
            // 仅当图片元素存在时才显示缩略图
            if ($image.length) {
                // 添加缩略图模式类
                $image.addClass('thumbnail-mode');
                
                // 设置临时小图
                $image.attr('src', thumbnailSrc);
                
                // 如果缩略图已经缓存，使用缓存的尺寸
                if (imageCache[thumbnailSrc]) {
                    resizeImageContainerToSize(
                        imageCache[thumbnailSrc].width,
                        imageCache[thumbnailSrc].height
                    );
                } else {
                    // 如果没有缓存，需要获取尺寸
                    cacheImage(thumbnailSrc, true, function() {
                        if (imageCache[thumbnailSrc]) {
                            resizeImageContainerToSize(
                                imageCache[thumbnailSrc].width,
                                imageCache[thumbnailSrc].height
                            );
                        }
                    });
                }
                
                // 显示图片（使用淡入效果）
                $image.fadeIn('fast');
            }
        }
        
        /**
         * 调整图片容器大小到指定尺寸
         */
        function resizeImageContainerToSize(width, height) {
            var $container = $('.lb-outerContainer');
            var $dataContainer = $('.lb-dataContainer');
            
            if ($container.length && $dataContainer.length) {
                // 调整容器大小
                $container.animate({
                    width: width,
                    height: height
                }, 400, 'swing');
                
                // 调整数据容器大小
                $dataContainer.animate({
                    width: width
                }, 400, 'swing');
            }
        }
        
        /**
         * 替换为高分辨率图片
         */
        function replaceWithHighResImage(src) {
            if (!imageCache[src]) return;
            
            var $image = $('.lb-image');
            if (!$image.length) return;
            
            // 当前图片URL
            var currentSrc = $image.attr('src');
            if (currentSrc === src) return; // 已经是高分辨率图片
            
            // 获取缓存的高分辨率图片
            var cachedImage = imageCache[src];
            
            // 添加加载高清图片的过渡类
            $image.addClass('loading-highres');
            
            // 设置图片尺寸
            setTimeout(function() {
                $image.attr('src', src);
                $image.css({
                    width: cachedImage.width + 'px',
                    height: cachedImage.height + 'px'
                });
                
                // 调整容器大小
                resizeImageContainerToSize(cachedImage.width, cachedImage.height);
                
                // 确保图片显示
                $image.fadeIn('fast');
                $('.lb-loader').hide();
                
                // 移除过渡类
                setTimeout(function() {
                    $image.removeClass('thumbnail-mode loading-highres');
                }, 500);
            }, 50);
        }
        
        /**
         * 立即预加载相邻图片
         */
        function preloadNeighborImages(currentIndex) {
            var lightbox = findLightboxInstance();
            if (!lightbox || !lightbox.album) return;
            
            var totalImages = lightbox.album.length;
            var prevIndex, nextIndex;
            
            // 判断是否支持循环浏览
            var wrapAroundEnabled = false;
            
            // 多种方式判断是否开启了循环浏览
            if (window.lightboxWrapAround === true) {
                wrapAroundEnabled = true;
            } else if (lightbox.options && lightbox.options.wrapAround === true) {
                wrapAroundEnabled = true;
            }
            
            // 确定前一张索引
            if (currentIndex > 0) {
                prevIndex = currentIndex - 1;
            } else if (wrapAroundEnabled) {
                // 如果启用了循环，预加载最后一张
                prevIndex = totalImages - 1;
            }
            
            // 确定后一张索引
            if (currentIndex < totalImages - 1) {
                nextIndex = currentIndex + 1;
            } else if (wrapAroundEnabled) {
                // 如果启用了循环，预加载第一张
                nextIndex = 0;
            }
            
            // 预加载前一张和后一张的缩略图和高清图
            if (prevIndex !== undefined) {
                try {
                    var prevThumb = lightbox.album[prevIndex].thumbnail;
                    var prevLarge = lightbox.album[prevIndex].link;
                    
                    if (prevThumb) cacheImage(prevThumb, true);
                    if (prevLarge) cacheImage(prevLarge, false);
                } catch (e) {
                    console.error('预加载前一张图片出错:', e);
                }
            }
            
            if (nextIndex !== undefined) {
                try {
                    var nextThumb = lightbox.album[nextIndex].thumbnail;
                    var nextLarge = lightbox.album[nextIndex].link;
                    
                    if (nextThumb) cacheImage(nextThumb, true);
                    if (nextLarge) cacheImage(nextLarge, false);
                } catch (e) {
                    console.error('预加载下一张图片出错:', e);
                }
            }
        }
        
        /**
         * 增强原生的changeImage方法
         */
        function enhanceChangeImageMethod() {
            // 尝试查找并增强Lightbox的changeImage方法
            var lightbox = findLightboxInstance();
            if (!lightbox || !lightbox.changeImage) return;
            
            var originalChangeImage = lightbox.changeImage;
            
            // 替换原方法
            lightbox.changeImage = function(imageNumber) {
                try {
                    // 保存当前索引
                    var previousIndex = this.currentImageIndex;
                    this.currentImageIndex = imageNumber;
                    
                    // 立即隐藏loading提示
                    $('.lb-loader').hide();
                    
                    // 确保所需数据存在
                    if (!this.album || !this.album[imageNumber] || !this.album[imageNumber].link) {
                        console.log("没有足够信息来显示图片，回退到原始方法");
                        originalChangeImage.call(this, imageNumber);
                        return;
                    }
                    
                    // 获取将要显示的图片URL
                    var targetSrc = this.album[imageNumber].link;
                    var thumbnailSrc = this.album[imageNumber].thumbnail;
                    
                    // 检查是否已缓存
                    if (imageCache[targetSrc]) {
                        // 直接使用缓存的高分辨率图片
                        var $image = $('.lb-image');
                        
                        // 如果图片元素存在，直接设置src
                        if ($image.length) {
                            // 添加过渡类
                            $image.addClass('loading-highres');
                            
                            $image.attr('src', targetSrc);
                            
                            // 使用缓存的尺寸
                            var cachedImage = imageCache[targetSrc];
                            $image.css({
                                width: cachedImage.width + 'px',
                                height: cachedImage.height + 'px'
                            });
                            
                            // 调整容器大小
                            resizeImageContainerToSize(cachedImage.width, cachedImage.height);
                            
                            // 安全调用原生方法以更新导航和详情
                            if (typeof this.updateNav === 'function') {
                                try { this.updateNav(); } catch(e) { console.error('updateNav错误', e); }
                            }
                            if (typeof this.updateDetails === 'function') {
                                try { this.updateDetails(); } catch(e) { console.error('updateDetails错误', e); }
                            }
                            
                            // 确保图片显示
                            $image.fadeIn('fast');
                            
                            // 移除过渡类
                            setTimeout(function() {
                                $image.removeClass('thumbnail-mode loading-highres');
                            }, 500);
                        } else {
                            // 如果图片元素不存在，调用原始方法
                            originalChangeImage.call(this, imageNumber);
                        }
                    } else {
                        // 图片未缓存
                        
                        // 如果有缩略图，先显示缩略图
                        if (thumbnailSrc) {
                            showThumbnailImage(thumbnailSrc);
                        } else {
                            // 没有缩略图，显示加载图标
                            $('.lb-loader').show();
                        }
                        
                        // 安全调用原生方法以更新导航和详情
                        if (typeof this.updateNav === 'function') {
                            try { this.updateNav(); } catch(e) { console.error('updateNav错误', e); }
                        }
                        if (typeof this.updateDetails === 'function') {
                            try { this.updateDetails(); } catch(e) { console.error('updateDetails错误', e); }
                        }
                        
                        // 后台加载高分辨率图片
                        cacheImage(targetSrc, false, function() {
                            replaceWithHighResImage(targetSrc);
                        });
                        
                        // 同时加载相邻图片
                        preloadNeighborImages(imageNumber);
                    }
                    
                    // 更新预加载队列中的优先级
                    updatePreloadPriorities(imageNumber);
                } catch (error) {
                    console.error('增强的changeImage方法出错，回退到原始方法', error);
                    // 出错时回退到原始方法
                    originalChangeImage.call(this, imageNumber);
                }
            };
        }
        
        /**
         * 更新预加载队列中的优先级
         */
        function updatePreloadPriorities(currentIndex) {
            // 如果预加载队列不为空，更新优先级
            if (preloadQueue.length > 0) {
                // 设置图片优先级
                for (var i = 0; i < preloadQueue.length; i++) {
                    var index = preloadQueue[i].index;
                    var isThumbnail = preloadQueue[i].isThumbnail;
                    
                    // 缩略图始终最高优先级
                    if (isThumbnail) {
                        preloadQueue[i].priority = 5;
                    } else if (index === currentIndex) {
                        preloadQueue[i].priority = 4; // 当前图片高清版
                    } else if (index === currentIndex + 1 || index === currentIndex - 1) {
                        preloadQueue[i].priority = 3; // 相邻图片高清版
                    } else if (index === currentIndex + 2 || index === currentIndex - 2) {
                        preloadQueue[i].priority = 2; // 次相邻图片高清版
                    } else {
                        preloadQueue[i].priority = 1; // 其他图片
                    }
                }
                
                // 重新排序队列
                preloadQueue.sort(function(a, b) {
                    return b.priority - a.priority;
                });
            }
        }
        
        // 让所有错误不影响主流程
        window.addEventListener('error', function(e) {
            console.error('图片预加载错误:', e.message);
            // 不阻止默认行为，只记录错误
            return false;
        });
    });
})(); 