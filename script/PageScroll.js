(function (global, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function ($) {
            return factory($, global, global.document);
        });
    } else if (typeof exports === "object" && exports) {
        module.exports = factory(require('jquery'), global, global.document);
    } else {
        factory(jQuery, global, global.document);
    }
})(typeof window !== 'undefined' ? window : this, function ($, window, document, undefined) {
    'use strict';

    var CONTAINER_CLASS = "pageScroll-container";
    var CONTAINER_WRAPPER_CLASS = "pageScroll-containerWrapper";
    var PAGE_CLASS = "pageScroll-page";
    var PAGE_CLASS_ACTIVE = "pageScroll-page-active";
    var KEYBOARD_UP = 38;
    var KEYBOARD_DOWN = 40;
    var TOUCH_THRESHOLD = 200;
    var Body = $('html, body');
    var ScrollOrientationType = Object.freeze({Vertical: 'Vertical', Horizontal: 'Horizontal'});

    $.fn.pageScroll = function (options) {
        var _pageScroll = PageScroll(this, options);
        return _pageScroll;
    };

    function PageScroll(element, options) {

        var _touchYStart = 0;
        var _touchXStart = 0;
        var _id;
        var _pages;
        var _container;
        var _currentPosition = 0;
        var _isScrollAnimationInProgress = false;
        var self = {
            Id: _id,
            MoveNext: moveNext,
            MovePrevious: movePrevious,
            SetPage: setPage
        };
        var _options = options;
        var _pageNavigation;

        init(element);

        function init(element) {
            _id = element.attr('id');
            if (!element.hasClass(CONTAINER_CLASS)) {
                element.addClass(CONTAINER_CLASS);
            }

            _pages = _.map(element.children('.' + PAGE_CLASS), function (val, num) {
                return {
                    value: $(val),
                    order: num
                }
            });

            element.wrapInner('<div class="' + CONTAINER_WRAPPER_CLASS + '"></div>');
            _container = element.children("." + CONTAINER_WRAPPER_CLASS);

            var activePages = _.filter(_pages, function (val) {
                return val.value.hasClass(PAGE_CLASS_ACTIVE);
            });
            if (activePages.length == 0) {
                _.first(_pages).value.addClass(PAGE_CLASS_ACTIVE);
            }
            if (activePages.length > 1)
                console.error("multiple active pages");
            Body.keydown(function (event) {//todo: handle for different instances
                if (event.which == KEYBOARD_UP) {
                    event.preventDefault();
                    movePrevious();
                }
                if (event.which == KEYBOARD_DOWN) {
                    event.preventDefault();
                    moveNext();
                }
            });

            if (typeof(PageScroll.GlobalWeelListenerSet) === 'undefined') {
                PageScroll.GlobalWeelListenerSet = window.addWheelListener(Body[0], function (e) {
                    e.preventDefault();
                    var last = _.last(PageScroll.ScrollElementsStack);
                    if (last == null)
                        return;
                    if (e.deltaY > 0) {
                        last.MoveNext();
                    }
                    else {
                        last.MovePrevious();
                    }
                });
            }
            if (typeof(PageScroll.ScrollElementsStack) === 'undefined') {
                PageScroll.ScrollElementsStack = new Array();
            }
            if (typeof(PageScroll.TouchEvenStatus) === 'undefined') {
                PageScroll.TouchEvenStatus = {Status: false, Element: self};
            }

            _container.hover(function () {
                    PageScroll.ScrollElementsStack.push(self);
                }, function () {

                    if (PageScroll.ScrollElementsStack.length > 1) {
                        PageScroll.ScrollElementsStack.pop();
                    }
                }
            );

            _container.on('touchstart', function (e) {
                //e.preventDefault();
                _touchYStart = getTouchCoordinates(e).y;
                _touchXStart = getTouchCoordinates(e).x;
                PageScroll.TouchEvenStatus.Element = self;
                PageScroll.TouchEvenStatus.Status = true;
            });
            _container.on('touchend', function (e) {
               // e.preventDefault();
                PageScroll.TouchEvenStatus.Status = false;
            });
            _container.on('touchmove', function (e) {
                //e.preventDefault();
                var coord = getTouchCoordinates(e);
                var deltaY = coord.y - _touchYStart;
                var deltaX = coord.x - _touchXStart;

                if (PageScroll.TouchEvenStatus.Status == true
                    && PageScroll.TouchEvenStatus.Element.Id == self.Id
                    && _touchYStart > 0
                    && Math.abs(deltaY) > TOUCH_THRESHOLD) {
                    if (_options.ScrollOrientation != ScrollOrientationType.Horizontal)
                        deltaY > 0 ? movePrevious() : moveNext();
                    _touchYStart = 0;
                    _touchXStart = 0;
                    PageScroll.TouchEvenStatus.Status = false;
                }
                if (PageScroll.TouchEvenStatus.Status == true
                    && PageScroll.TouchEvenStatus.Element.Id == self.Id
                    && _touchXStart > 0
                    && Math.abs(deltaX) > TOUCH_THRESHOLD) {
                    if (_options.ScrollOrientation == ScrollOrientationType.Horizontal)
                        deltaX > 0 ? movePrevious() : moveNext();
                    _touchYStart = 0;
                    _touchXStart = 0;
                    PageScroll.TouchEvenStatus.Status = false;
                }
            });
            moveToAndSetPosition(_pages[0]);

            if (_options.PageNavigation == null) {
                _pageNavigation = {
                    MoveNext: function () {
                    },
                    MovePrevious: function () {
                    }
                }
            } else {
                _pageNavigation = _options.PageNavigation;
            }
            setupWidth();
            $(window).resize(setupWidth);
        }

        function setupWidth() {
            if (_options.ScrollOrientation == ScrollOrientationType.Horizontal) {
                var pagesCount = _pages.length;
                var width = element.width();
                _pages.forEach(function (val) {
                    //var parentWidth = element.width();

                    val.value.css({
                        'float': 'left',
                        'width': width
                    });
                });
                var horizontalPageWidth = width * pagesCount;
                _container.css({
                    'width': horizontalPageWidth
                });
            }
            moveToAndSetPosition(_pages[_currentPosition]);
        }

        function getTouchCoordinates(e) {
            var coordinates = {
                y: e.originalEvent.touches[0].pageY,
                x: e.originalEvent.touches[0].pageX
            };
            return coordinates;
        }

        function moveNext() {
            if (_currentPosition < _pages.length - 1) {
                moveToAndSetPosition(_pages[_currentPosition + 1])
                _pageNavigation.MoveNext();
            }
        }

        function movePrevious() {
            if (_currentPosition > 0) {
                moveToAndSetPosition(_pages[_currentPosition - 1])
                _pageNavigation.MovePrevious();
            }
        }

        function moveToAndSetPosition(element) {
            console.debug(element);
            if (_isScrollAnimationInProgress)
                return;

            _isScrollAnimationInProgress = true;
            var translate3d;
            switch (options.ScrollOrientation) {
                case ScrollOrientationType.Horizontal:
                    var xPos = element.order * element.value.width();
                    translate3d = 'translate3d(' + -xPos + 'px, 0px, 0px)';
                    break;
                case ScrollOrientationType.Vertical:
                default:
                    var yPos = element.order * element.value.height();
                    translate3d = 'translate3d(0px, ' + -yPos + 'px, 0px)';
                    break;
            }


            _container.css(getCrossBrowserTransforms(translate3d));
            _currentPosition = element.order;
            _isScrollAnimationInProgress = false;
        }

        function getCrossBrowserTransforms(translate3d) {
            return {
                '-webkit-transform': translate3d,
                '-moz-transform': translate3d,
                '-ms-transform': translate3d,
                'transform': translate3d,
                '-webkit-transition': 'all 1000ms ease',
                'transition': 'all 1000ms ease'
            };
        }

        function setPage(number) {
            moveToAndSetPosition(_pages[number]);
        }

        return self;
    }
});