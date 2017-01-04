(function (global, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], ['underscore'], function ($) {
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

    $.fn.pageScroll = function (options) {
        var _pageScroll = PageScroll(this, options);
    };

    function PageScroll(element, options) {
        var _touchYStart = 0;
        var _id;
        var _pages;
        var _container;
        var _currentPosition = 0;
        var _isScrollAnimationInProgress = false;
        var self = {
            Id: _id,
            MoveNext: moveNext,
            MovePrevious: movePrevious
        };

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

            _container.on('mouseenter', function (e) {
                e.preventDefault();
                PageScroll.ScrollElementsStack.push(self);
            });
            _container.on('mouseleave', function (e) {
                e.preventDefault();
                PageScroll.ScrollElementsStack.pop();
            });
            _container.on('touchstart', function (e) {
                e.preventDefault();
                _touchYStart = getTouchCoordinates(e).y;
                PageScroll.TouchEvenStatus.Element = self;
                PageScroll.TouchEvenStatus.Status = true;
            });
            _container.on('touchend', function (e) {
                e.preventDefault();
                PageScroll.TouchEvenStatus.Status = false;
            });
            _container.on('touchmove', function (e) {
                e.preventDefault();
                var coord = getTouchCoordinates(e);
                var delta = coord.y - _touchYStart;

                if (PageScroll.TouchEvenStatus.Status == true
                    && PageScroll.TouchEvenStatus.Element.Id == self.Id
                    && _touchYStart > 0
                    && Math.abs(delta) > TOUCH_THRESHOLD) {

                    delta > 0 ? movePrevious() : moveNext();
                    _touchYStart = 0;
                    PageScroll.TouchEvenStatus.Status = false;
                }
            });
            moveToAndSetPosition(_pages[0]);
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
            }
        }

        function movePrevious() {
            if (_currentPosition > 0) {
                moveToAndSetPosition(_pages[_currentPosition - 1])
            }
        }

        function moveToAndSetPosition(element) {
            console.debug(element);
            if (_isScrollAnimationInProgress)
                return;

            _isScrollAnimationInProgress = true;
            var yPos = element.order * element.value.height();
            var translate3d = 'translate3d(0px, ' + -yPos + 'px, 0px)';
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

        return self;
    }
});