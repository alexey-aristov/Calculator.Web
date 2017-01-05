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

    var CONTAINER_CLASS = "pageNavigation-container";
    var NAV_ELEMENT_CLASS = "pageNavigation-element";
    var NAV_ELEMENT_ACTIVE_CLASS = "pageNavigation-element-active";


    $.fn.pageNavigation = function (options) {
        var _pageNavigation = Navigation(this, options);
        return _pageNavigation;
    };
    function Navigation(element, options) {

        var _touchYStart = 0;
        var _touchXStart = 0;
        var _id;
        var _navElements;
        var _activeElement;
        var _container;
        var _currentPosition = 0;
        var _isScrollAnimationInProgress = false;
        var _pageScroll;
        var self = {
            Id: _id,
            MoveNext: moveNext,
            MovePrevious: movePrevious,
            SetPage: setPage,
            AssociateScroll: function (scroll) {
                _pageScroll = scroll;
            }
        };
        var _options = options;

        init(element);

        function init(element) {
            _id = element.attr('id');
            if (!element.hasClass(CONTAINER_CLASS)) {
                element.addClass(CONTAINER_CLASS);
            }

            _navElements = _.map(element.children('.' + NAV_ELEMENT_CLASS), function (val, num) {
                var element = $(val);
                element.on('click', function (e) {
                    e.preventDefault();
                    setActive(element);
                    _currentPosition = num;
                    if (_pageScroll != null) {
                        _pageScroll.SetPage(num);
                    }
                });
                return {
                    value: element,
                    order: num
                }
            });
            var activePages = _.filter(_navElements, function (val) {
                return val.value.hasClass(NAV_ELEMENT_ACTIVE_CLASS);
            });
            if (activePages.length == 0) {
                _activeElement = _.first(_navElements).value;
                _activeElement.addClass(NAV_ELEMENT_ACTIVE_CLASS);
            }
            if (activePages.length > 1)
                console.error("multiple active pages");
        }

        function setActive(element) {
            if (_activeElement != null)
                _activeElement.removeClass(NAV_ELEMENT_ACTIVE_CLASS);
            element.addClass(NAV_ELEMENT_ACTIVE_CLASS);
            _activeElement = element;
        }

        function setActiveByPosition(position) {
            var el = _navElements[position];
            setActive(el.value);
            _currentPosition = position;
        }

        function moveNext() {
            setActiveByPosition(_currentPosition + 1);
        }

        function movePrevious() {
            setActiveByPosition(_currentPosition - 1);
        }

        function setPage(id) {

        }

        return self;
    };
});