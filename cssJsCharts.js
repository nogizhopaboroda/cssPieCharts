//по мотивам http://atomicnoggin.ca/blog/2010/02/20/pure-css3-pie-charts/

(function (window) {

    window.Charts = function (container, options) {
        /* constructor */
        this.container = container;

        this.options = options.options;

        if(options.parts.length == 0) {
            throw new Error("there are no parts");
        }
        this.parts   = options.parts;

        this.standartSettings = {
            "colors": ['#1E9E56', '#48B8E8', '#DB3957', '#EDDE37', '#F0611A'],
            "legend": false,
            "gradientColors": false,
            "radius": 130
        };

        this.transformStyleNames = ['mozTransform', 'webkitTransform', 'oTransform', 'transform'];
        this.gradientPropertyNames = ['-webkit-radial-gradient', '-moz-radial-gradient', '-o-radial-gradient', '-ms-radial-gradient']

    };

    window.Charts.prototype.buildChart = function () {
        var chartContainer = document.createElement("div");
            chartContainer.classList.add("chart");
            chartContainer.style.position = "relative";

        var radius = this.options.radius || this.standartSettings.radius;
        var widthHeight = (radius * 2).toString();

        var lastDegree = 0;

        for(var i = 0, j = this.parts.length; i < this.parts.length; i++, j--) {
            var part = this.parts[i];
            part.color = part.color || this.standartSettings.colors.shift();

            /* если кусок больше 50%, разбиваем на 50 и остаток */
            if(part.percent > 50) {
                part.remainder = part.percent - 50;
                part.percent = 50;
                part.gt50 = true;
            }

            var degree = lastDegree;  //угол поворота держателя
            var pt = part.percent / 100;
            var pieceDegree = 360 * pt; //угол поворота кусочка

            lastDegree += pieceDegree;

            //генерация куска
            //обертка
            var pieceHolder = document.createElement("div");
                pieceHolder.classList.add("piece-holder");

            //сам кусочек
            var piece = document.createElement("div");
                piece.classList.add("piece");
                piece.classList.add("piece-" + i);

            /**/
            piece.addEventListener('click', function (event) {
                console.log(event.target);
            });
            /**/

            //приделываем стили, поворачивающие на нужный градус
            for(var k = 0; k < this.transformStyleNames.length; k++) {
                pieceHolder.style[this.transformStyleNames[k]] = "rotate(" + degree + "deg)";
                piece.style[this.transformStyleNames[k]] = "rotate(" + pieceDegree + "deg)";
            }
            pieceHolder.style.width = widthHeight + "px";
            pieceHolder.style.height = widthHeight + "px";
            pieceHolder.style.clip = "rect(0px," + widthHeight + "px, " + widthHeight + "px, " + radius + "px)";
            pieceHolder.style.position = "absolute";
            piece.style.width = widthHeight + "px";
            piece.style.height = widthHeight + "px";
            piece.style.clip = "rect(0px," + radius + "px, " + widthHeight + "px, 0px)";
            piece.style.position = "absolute";
            piece.style.borderRadius = radius + "px";

            //закрашиваем кусок
            piece.style.backgroundColor = part.color;

            //эксперимент с градиентом
            if(this.options.gradient) {
                var disp = this.colorMethods.generateDispersion(part.color, 2, 90);
                var _gradientProperty = "";
                for(var m = 0; m < this.gradientPropertyNames.length; m++){
                    _gradientProperty += "background: " + this.gradientPropertyNames[m] + "(center, ellipse cover, " + disp[1].toStyleProperty() + " 10%, " + disp[0].toStyleProperty() + " 100%); ";
                }
                if(document.styleSheets.length == 0) {
                    document.getElementsByTagName('head')[0].appendChild(document.createElement('style'));
                }
                if (document.styleSheets[0].addRule) {
                    document.styleSheets[0].addRule(".piece-" + i, _gradientProperty, document.styleSheets[0].cssRules.length);
                } else document.styleSheets[0].insertRule(".piece-" + i + " { " +  _gradientProperty + "}", document.styleSheets[0].cssRules.length);

            }

            pieceHolder.appendChild(piece); //сборка полного блока кусочка

            /* второй кусочек, если процент > 50 */
            if(part.gt50) {
                var _degree = lastDegree;
                var _pieceDegree = 360 * (part.remainder / 100); //угол поворота кусочка

                lastDegree += _pieceDegree;
                var pieceHolderCloned = pieceHolder.cloneNode();
                var pieceCloned = piece.cloneNode();
                //pieceHolder.style.clip = "rect(0px," + widthHeight + "px, " + widthHeight + "px, " + radius + "px)";
                for(var k = 0; k < this.transformStyleNames.length; k++) {
                    pieceHolderCloned.style[this.transformStyleNames[k]] = "rotate(" + _degree + "deg)";
                    pieceCloned.style[this.transformStyleNames[k]] = "rotate(" + _pieceDegree + "deg)";
                }

                //маркируем куски
                pieceHolder.classList.add("great-piece");
                pieceHolderCloned.classList.add("remainder-piece");

                pieceHolderCloned.appendChild(pieceCloned);
                chartContainer.appendChild(pieceHolderCloned);
            }

            chartContainer.appendChild(pieceHolder);
            this.container.appendChild(chartContainer);
        }
    };

    window.Charts.prototype.colorMethods = {
        hexToR: function (h) {return parseInt((this.cutHex(h)).substring(0,2),16)},
        hexToG: function (h) {return parseInt((this.cutHex(h)).substring(2,4),16)},
        hexToB: function (h) {return parseInt((this.cutHex(h)).substring(4,6),16)},
        cutHex: function (h) {return (h.charAt(0)=="#") ? h.substring(1,7):h},
        hexToRGB: function (h, opacity) {
            var RGB = new Object({
                R: this.hexToR(h),
                G: this.hexToG(h),
                B: this.hexToB(h)
            });
            if(opacity) RGB.opacity = opacity;

            this._decorateRGBObject(RGB);
            return RGB;
        },
        generateDispersion: function (color, gradations, dispersion) {
            var RGB = this.hexToRGB(color);
            var bla = gradations * dispersion;
            if(bla > 255) {
                throw new Error("Common dispersion great than 255");
            }
            if(RGB.G - bla < 0) RGB.G = bla;
            var generated = [];
            var step = Math.round(((RGB.G + dispersion) - (RGB.G - dispersion)) / gradations);
            for(var i = RGB.G - dispersion; i < RGB.G + dispersion; i += step) {
                var _RGB = new Object({
                    R: RGB.R,
                    G: i,//step * i,//(RGB.G - dispersion * i),
                    B: RGB.B
                });
                this._decorateRGBObject(_RGB);
                generated.push(_RGB);
            }
            return generated;
        },
        _decorateRGBObject: function (RGBObject) {
            Object.defineProperties(RGBObject, {
                "toArray": {
                    value: function () {
                        var rgbArray = [this.R, this.G, this.B];
                        if(this.opacity) rgbArray.push(this.opacity);
                        return rgbArray;
                    },
                    enumerable: false
                },
                "toStyleProperty": {
                    value: function () {
                        var style = this.R + ", " + this.G + ", " + this.B;
                        if(this.opacity) style += ", " + this.opacity;
                        return "rgb(" + style + ")";
                    },
                    enumerable: false
                }
            });
        }
    };

})(window);