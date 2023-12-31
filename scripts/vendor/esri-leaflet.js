/*! Esri-Leaflet - v0.0.1-beta.4 - 2014-03-09
 *   Copyright (c) 2014 Environmental Systems Research Institute, Inc.
 *   Apache License*/
L.esri = {
        _callback: {}
    }, L.esri.Support = {
        CORS: !!(window.XMLHttpRequest && "withCredentials" in new XMLHttpRequest)
    }, L.esri.RequestHandlers = {
        CORS: function(a, b, c, d) {
            var e = new XMLHttpRequest;
            b.f = "json", e.onreadystatechange = function() {
                var a;
                if (4 === e.readyState) {
                    try {
                        a = JSON.parse(e.responseText)
                    } catch (b) {
                        a = {
                            error: "Could not parse response as JSON."
                        }
                    }
                    d ? c.call(d, a) : c(a)
                }
            }, e.open("GET", a + "?" + L.esri.Util.serialize(b), !0), e.send(null)
        },
        JSONP: function(a, b, c, d) {
            var e = "c" + (1e9 * Math.random()).toString(36).replace(".", "_");
            b.f = "json", b.callback = "L.esri._callback." + e;
            var f = L.DomUtil.create("script", null, document.body);
            f.type = "text/javascript", f.src = a + "?" + L.esri.Util.serialize(b), f.id = e, L.esri._callback[e] = function(a) {
                d ? c.call(d, a) : c(a), document.body.removeChild(f), delete L.esri._callback[e]
            }
        }
    }, L.esri.get = L.esri.Support.CORS ? L.esri.RequestHandlers.CORS : L.esri.RequestHandlers.JSONP, L.esri.Mixins = {}, L.esri.Mixins.featureGrid = {
        _activeRequests: 0,
        _initializeFeatureGrid: function(a) {
            this._map = a, this._previousCells = [], this.center = this._map.getCenter(), this.origin = this._map.project(this.center), this._moveHandler = L.esri.Util.debounce(function(a) {
                "zoomend" === a.type && (this.origin = this._map.project(this.center), this._previousCells = []), this._requestFeatures(a.target.getBounds())
            }, this.options.debounce, this), a.on("zoomend resize move", this._moveHandler, this), this._requestFeatures(a.getBounds())
        },
        _destroyFeatureGrid: function(a) {
            a.off("zoomend resize move", this._moveHandler, this)
        },
        _requestFeatures: function(a) {
            var b = this._cellsWithin(a);
            b && b.length > 0 && this.fire("loading", {
                bounds: a
            });
            for (var c = 0; c < b.length; c++) this._makeRequest(b[c], b, a)
        },
        _makeRequest: function(a, b, c) {
            this._activeRequests++;
            var d = {
                geometryType: "esriGeometryEnvelope",
                geometry: JSON.stringify(L.esri.Util.boundsToExtent(a.bounds)),
                outFields: this.options.fields.join(","),
                outSR: 4326,
                inSR: 4326,
                where: this.options.where
            };
            this.options.token && (d.token = this.options.token), L.esri.get(this.url + "query", d, function(a) {
                this._activeRequests--, this._activeRequests <= 0 && this.fire("load", {
                    bounds: c
                }), !a.error || 499 !== a.error.code && 498 !== a.error.code ? this._render(a) : this._authenticating || (this._authenticating = !0, this.fire("authenticationrequired", {
                    retry: L.Util.bind(function(a) {
                        this._authenticating = !1, this.options.token = a, this._previousCells = [], this._requestFeatures(this._map.getBounds())
                    }, this)
                }))
            }, this)
        },
        _cellsWithin: function(a) {
            var b = this._map.getSize(),
                c = this._map.project(this._map.getCenter());
            Math.min(this.options.cellSize / b.x, this.options.cellSize / b.y);
            for (var d = a.pad(.1), e = [], f = this._map.project(d.getNorthWest()), g = this._map.project(d.getSouthEast()), h = f.subtract(c).divideBy(this.options.cellSize), i = g.subtract(c).divideBy(this.options.cellSize), j = Math.round((this.origin.x - c.x) / this.options.cellSize), k = Math.round((this.origin.y - c.y) / this.options.cellSize), l = L.esri.Util.roundAwayFromZero(h.x) - j, m = L.esri.Util.roundAwayFromZero(i.x) - j, n = L.esri.Util.roundAwayFromZero(h.y) - k, o = L.esri.Util.roundAwayFromZero(i.y) - k, p = l; m > p; p++)
                for (var q = n; o > q; q++) {
                    var r = "cell:" + p + ":" + q,
                        s = L.esri.Util.indexOf(this._previousCells, r) >= 0;
                    if (!s || !this.options.deduplicate) {
                        var t = this._cellExtent(p, q),
                            u = t.getCenter(),
                            v = u.distanceTo(t.getNorthWest()),
                            w = u.distanceTo(this.center),
                            x = {
                                row: p,
                                col: q,
                                id: r,
                                center: u,
                                bounds: t,
                                distance: w,
                                radius: v
                            };
                        e.push(x), this._previousCells.push(r)
                    }
                }
            return e.sort(function(a, b) {
                return a.distance - b.distance
            }), e
        },
        _cellExtent: function(a, b) {
            var c = this._cellPoint(a, b),
                d = this._cellPoint(a + 1, b + 1),
                e = this._map.unproject(c),
                f = this._map.unproject(d);
            return L.latLngBounds(e, f)
        },
        _cellPoint: function(a, b) {
            var c = this.origin.x + a * this.options.cellSize,
                d = this.origin.y + b * this.options.cellSize;
            return [c, d]
        }
    }, L.esri.Mixins.identifiableLayer = {
        identify: function(a, b, c) {
            var d = {
                sr: "4326",
                mapExtent: JSON.stringify(L.esri.Util.boundsToExtent(this._map.getBounds())),
                tolerance: 5,
                geometryType: "esriGeometryPoint",
                imageDisplay: this._map._size.x + "," + this._map._size.y + ",96",
                geometry: JSON.stringify({
                    x: a.lng,
                    y: a.lat,
                    spatialReference: {
                        wkid: 4326
                    }
                })
            };
            this.options.layers && (d.layers = this.options.layers);
            var e;
            "function" == typeof b && "undefined" == typeof c ? (c = b, e = d) : "object" == typeof b && (b.layerDefs && (b.layerDefs = this.parseLayerDefs(b.layerDefs)), e = L.Util.extend(d, b)), L.esri.get(this.url + "/identify", e, c)
        },
        parseLayerDefs: function(a) {
            return a instanceof Array ? "" : "object" == typeof a ? JSON.stringify(a) : a
        }
    }, L.esri.Mixins.metadata = {
        _getMetadata: function() {
            var a = {};
            this.options.token && (a.token = this.options.token), L.esri.get(this.url, a, function(a) {
                if (!a.error || 499 !== a.error.code && 498 !== a.error.code) {
                    var b = a.extent || a.initialExtent || a.fullExtent,
                        c = {
                            metadata: a
                        };
                    b && this._map && (!this._map || 102100 !== b.spatialReference.wkid && 3857 !== b.spatialReference.wkid ? 4326 === b.spatialReference.wkid && (c.bounds = L.esri.Util.extentToBounds(b)) : c.bounds = L.esri.Util.mercatorExtentToBounds(b, this._map)), this.fire("metadata", c)
                } else this._authenticating || (this._authenticating = !0, this.fire("authenticationrequired", {
                    retry: L.Util.bind(function(a) {
                        this.options.token = a, this._getMetadata(), this._update()
                    }, this)
                }))
            }, this)
        }
    },
    function(L) {
        function a(a) {
            var b = {};
            for (var c in a) a.hasOwnProperty(c) && (b[c] = a[c]);
            return b
        }

        function b(a) {
            var b, c = 0,
                d = 0,
                e = a.length,
                f = a[d];
            for (d; e - 1 > d; d++) b = a[d + 1], c += (b[0] - f[0]) * (b[1] + f[1]), f = b;
            return c >= 0
        }

        function c(a, b, c, d) {
            var e = (d[0] - c[0]) * (a[1] - c[1]) - (d[1] - c[1]) * (a[0] - c[0]),
                f = (b[0] - a[0]) * (a[1] - c[1]) - (b[1] - a[1]) * (a[0] - c[0]),
                g = (d[1] - c[1]) * (b[0] - a[0]) - (d[0] - c[0]) * (b[1] - a[1]);
            if (0 !== g) {
                var h = e / g,
                    i = f / g;
                if (h >= 0 && 1 >= h && i >= 0 && 1 >= i) return !0
            }
            return !1
        }

        function d(a, b) {
            for (var d = 0; d < a.length - 1; d++)
                for (var e = 0; e < b.length - 1; e++)
                    if (c(a[d], a[d + 1], b[e], b[e + 1])) return !0;
            return !1
        }

        function e(a, b) {
            for (var c = !1, d = -1, e = a.length, f = e - 1; ++d < e; f = d)(a[d][1] <= b[1] && b[1] < a[f][1] || a[f][1] <= b[1] && b[1] < a[d][1]) && b[0] < (a[f][0] - a[d][0]) * (b[1] - a[d][1]) / (a[f][1] - a[d][1]) + a[d][0] && (c = !c);
            return c
        }

        function f(a, b) {
            var c = d(a, b),
                f = e(a, b[0]);
            return !c && f ? !0 : !1
        }

        function g(a) {
            for (var c = [], d = [], e = 0; e < a.length; e++) {
                var g = a[e].slice(0);
                if (b(g)) {
                    var h = [g];
                    c.push(h)
                } else d.push(g)
            }
            for (; d.length;) {
                for (var i = d.pop(), j = !1, k = c.length - 1; k >= 0; k--) {
                    var l = c[k][0];
                    if (f(l, i)) {
                        c[k].push(i), j = !0;
                        break
                    }
                }
                j || c.push([i.reverse()])
            }
            return 1 === c.length ? {
                type: "Polygon",
                coordinates: c[0]
            } : {
                type: "MultiPolygon",
                coordinates: c
            }
        }

        function h(a) {
            for (var b = null, c = null, d = null, e = null, f = 0; f < a.length; f++) {
                var g = a[f],
                    h = g[0],
                    i = g[1];
                null === b ? b = h : b > h && (b = h), null === c ? c = h : h > c && (c = h), null === d ? d = i : d > i && (d = i), null === e ? e = i : i > e && (e = i)
            }
            return [b, d, c, e]
        }

        function i(a) {
            for (var b = null, c = null, d = null, e = null, f = 0; f < a.length; f++)
                for (var g = a[f], h = 0; h < g.length; h++) {
                    var i = g[h],
                        j = i[0],
                        k = i[1];
                    null === b ? b = j : b > j && (b = j), null === c ? c = j : j > c && (c = j), null === d ? d = k : d > k && (d = k), null === e ? e = k : k > e && (e = k)
                }
            return [b, d, c, e]
        }

        function j(a) {
            for (var b = null, c = null, d = null, e = null, f = 0; f < a.length; f++)
                for (var g = a[f], h = 0; h < g.length; h++)
                    for (var i = g[h], j = 0; j < i.length; j++) {
                        var k = i[j],
                            l = k[0],
                            m = k[1];
                        null === b ? b = l : b > l && (b = l), null === c ? c = l : l > c && (c = l), null === d ? d = m : d > m && (d = m), null === e ? e = m : m > e && (e = m)
                    }
            return [b, d, c, e]
        }

        function k(a) {
            var c = [],
                d = a.slice(0),
                e = d.shift().slice(0);
            b(e) || e.reverse(), c.push(e);
            for (var f = 0; f < d.length; f++) {
                var g = d[f].slice(0);
                b(g) && g.reverse(), c.push(g)
            }
            return c
        }

        function l(a) {
            for (var b = [], c = 0; c < a.length; c++)
                for (var d = k(a[c]), e = d.length - 1; e >= 0; e--) {
                    var f = d[e].slice(0);
                    b.push(f)
                }
            return b
        }
        L.esri.Util = {
            debounce: function(a, b) {
                var c = null;
                return function() {
                    var d = this || d,
                        e = arguments;
                    clearTimeout(c), c = setTimeout(function() {
                        a.apply(d, e)
                    }, b)
                }
            },
            roundAwayFromZero: function(a) {
                return a > 0 ? Math.ceil(a) : Math.floor(a)
            },
            trim: function(a) {
                return a.replace(/^\s\s*/, "").replace(/\s\s*$/, "")
            },
            cleanUrl: function(a) {
                return a = L.esri.Util.trim(a), "/" !== a[a.length - 1] && (a += "/"), a
            },
            serialize: function(a) {
                var b = "";
                for (var c in a)
                    if (a.hasOwnProperty(c)) {
                        var d = c,
                            e = a[c];
                        b += encodeURIComponent(d), b += "=", b += encodeURIComponent(e), b += "&"
                    } return b.substring(0, b.length - 1)
            },
            indexOf: function(a, b, c) {
                if (c = c || 0, a.indexOf) return a.indexOf(b, c);
                for (var d = c, e = a.length; e > d; d++)
                    if (a[d] === b) return d;
                return -1
            },
            extentToBounds: function(a) {
                var b = new L.LatLng(a.ymin, a.xmin),
                    c = new L.LatLng(a.ymax, a.xmax);
                return new L.LatLngBounds(b, c)
            },
            mercatorExtentToBounds: function(a, b) {
                var c = b.unproject(L.point([a.ymin, a.xmin])),
                    d = b.unproject(L.point([a.ymax, a.xmax]));
                return new L.LatLngBounds(c, d)
            },
            boundsToExtent: function(a) {
                return {
                    xmin: a.getSouthWest().lng,
                    ymin: a.getSouthWest().lat,
                    xmax: a.getNorthEast().lng,
                    ymax: a.getNorthEast().lat,
                    spatialReference: {
                        wkid: 4326
                    }
                }
            },
            boundsToEnvelope: function(a) {
                var b = L.esri.Util.boundsToExtent(a);
                return {
                    x: b.xmin,
                    y: b.ymin,
                    w: Math.abs(b.xmin - b.xmax),
                    h: Math.abs(b.ymin - b.ymax)
                }
            },
            arcgisToGeojson: function(b, c) {
                var d = {};
                return c = c || {}, c.idAttribute = c.idAttribute || void 0, b.x && b.y && (d.type = "Point", d.coordinates = [b.x, b.y]), b.points && (d.type = "MultiPoint", d.coordinates = b.points.slice(0)), b.paths && (1 === b.paths.length ? (d.type = "LineString", d.coordinates = b.paths[0].slice(0)) : (d.type = "MultiLineString", d.coordinates = b.paths.slice(0))), b.rings && (d = g(b.rings.slice(0))), (b.geometry || b.attributes) && (d.type = "Feature", d.geometry = b.geometry ? L.esri.Util.arcgisToGeojson(b.geometry) : null, d.properties = b.attributes ? a(b.attributes) : null, b.attributes && (d.id = b.attributes[c.idAttribute] || b.attributes.OBJECTID || b.attributes.FID)), d
            },
            geojsonToArcGIS: function(a, b) {
                var c, d = b && b.idAttribute ? b.idAttribute : "OBJECTID",
                    e = b && b.sr ? {
                        wkid: b.sr
                    } : {
                        wkid: 4326
                    },
                    f = {};
                switch (a.type) {
                    case "Point":
                        f.x = a.coordinates[0], f.y = a.coordinates[1], f.spatialReference = e;
                        break;
                    case "MultiPoint":
                        f.points = a.coordinates.slice(0), f.spatialReference = e;
                        break;
                    case "LineString":
                        f.paths = [a.coordinates.slice(0)], f.spatialReference = e;
                        break;
                    case "MultiLineString":
                        f.paths = a.coordinates.slice(0), f.spatialReference = e;
                        break;
                    case "Polygon":
                        f.rings = k(a.coordinates.slice(0)), f.spatialReference = e;
                        break;
                    case "MultiPolygon":
                        f.rings = l(a.coordinates.slice(0)), f.spatialReference = e;
                        break;
                    case "Feature":
                        a.geometry && (f.geometry = L.esri.Util.geojsonToArcGIS(a.geometry, b)), f.attributes = a.properties ? L.esri.Util.clone(a.properties) : {}, f.attributes[d] = a.id;
                        break;
                    case "FeatureCollection":
                        for (f = [], c = 0; c < a.features.length; c++) f.push(L.esri.Util.geojsonToArcGIS(a.features[c], b));
                        break;
                    case "GeometryCollection":
                        for (f = [], c = 0; c < a.geometries.length; c++) f.push(L.esri.Util.geojsonToArcGIS(a.geometries[c], b))
                }
                return f
            },
            geojsonBounds: function(a) {
                if (a.type) switch (a.type) {
                    case "Point":
                        return [a.coordinates[0], a.coordinates[1], a.coordinates[0], a.coordinates[1]];
                    case "MultiPoint":
                        return h(a.coordinates);
                    case "LineString":
                        return h(a.coordinates);
                    case "MultiLineString":
                        return i(a.coordinates);
                    case "Polygon":
                        return i(a.coordinates);
                    case "MultiPolygon":
                        return j(a.coordinates);
                    case "Feature":
                        return a.geometry ? L.esri.Util.geojsonBounds(a.geometry) : null;
                    default:
                        throw new Error("Unknown type: " + a.type)
                }
                return null
            }
        }
    }(L),
    function(L) {
        "use strict";

        function a(b, c) {
            return this instanceof a ? (this._maxEntries = Math.max(4, b || 9), this._minEntries = Math.max(2, Math.ceil(.4 * this._maxEntries)), c && this._initFormat(c), this.clear(), void 0) : new a(b, c)
        }
        a.prototype = {
            all: function() {
                return this._all(this.data, [])
            },
            search: function(a) {
                var b = this.data,
                    c = [];
                if (!this._intersects(a, b.bbox)) return c;
                for (var d, e, f, g, h = []; b;) {
                    for (d = 0, e = b.children.length; e > d; d++) f = b.children[d], g = b.leaf ? this.toBBox(f) : f.bbox, this._intersects(a, g) && (b.leaf ? c.push(f) : this._contains(a, g) ? this._all(f, c) : h.push(f));
                    b = h.pop()
                }
                return c
            },
            load: function(a) {
                if (!a || !a.length) return this;
                if (a.length < this._minEntries) {
                    for (var b = 0, c = a.length; c > b; b++) this.insert(a[b]);
                    return this
                }
                var d = this._build(a.slice(), 0);
                if (this.data.children.length)
                    if (this.data.height === d.height) this._splitRoot(this.data, d);
                    else {
                        if (this.data.height < d.height) {
                            var e = this.data;
                            this.data = d, d = e
                        }
                        this._insert(d, this.data.height - d.height - 1, !0)
                    }
                else this.data = d;
                return this
            },
            insert: function(a) {
                return a && this._insert(a, this.data.height - 1), this
            },
            clear: function() {
                return this.data = {
                    children: [],
                    leaf: !0,
                    bbox: this._empty(),
                    height: 1
                }, this
            },
            remove: function(a) {
                if (!a) return this;
                for (var b, c, d, e, f = this.data, g = this.toBBox(a), h = [], i = []; f || h.length;) {
                    if (f || (f = h.pop(), c = h[h.length - 1], b = i.pop(), e = !0), f.leaf && (d = f.children.indexOf(a), -1 !== d)) return f.children.splice(d, 1), h.push(f), this._condense(h), this;
                    e || f.leaf || !this._intersects(g, f.bbox) ? c ? (b++, f = c.children[b], e = !1) : f = null : (h.push(f), i.push(b), b = 0, c = f, f = f.children[0])
                }
                return this
            },
            toBBox: function(a) {
                return a
            },
            compareMinX: function(a, b) {
                return a[0] - b[0]
            },
            compareMinY: function(a, b) {
                return a[1] - b[1]
            },
            toJSON: function() {
                return this.data
            },
            fromJSON: function(a) {
                return this.data = a, this
            },
            _all: function(a, b) {
                for (var c = []; a;) a.leaf ? b.push.apply(b, a.children) : c.push.apply(c, a.children), a = c.pop();
                return b
            },
            _build: function(a, b, c) {
                var d, e = a.length,
                    f = this._maxEntries;
                if (f >= e) return d = {
                    children: a,
                    leaf: !0,
                    height: 1
                }, this._calcBBox(d), d;
                b || (c = Math.ceil(Math.log(e) / Math.log(f)), f = Math.ceil(e / Math.pow(f, c - 1)), a.sort(this.compareMinX)), d = {
                    children: [],
                    height: c
                };
                var g, h, i, j, k, l = Math.ceil(e / f) * Math.ceil(Math.sqrt(f)),
                    m = Math.ceil(e / f),
                    n = 1 === b % 2 ? this.compareMinX : this.compareMinY;
                for (g = 0; e > g; g += l)
                    for (i = a.slice(g, g + l).sort(n), h = 0, j = i.length; j > h; h += m) k = this._build(i.slice(h, h + m), b + 1, c - 1), d.children.push(k);
                return this._calcBBox(d), d
            },
            _chooseSubtree: function(a, b, c, d) {
                for (var e, f, g, h, i, j, k, l;;) {
                    if (d.push(b), b.leaf || d.length - 1 === c) break;
                    for (k = l = 1 / 0, e = 0, f = b.children.length; f > e; e++) g = b.children[e], i = this._area(g.bbox), j = this._enlargedArea(a, g.bbox) - i, l > j ? (l = j, k = k > i ? i : k, h = g) : j === l && k > i && (k = i, h = g);
                    b = h
                }
                return b
            },
            _insert: function(a, b, c, d) {
                var e, f = c ? a.bbox : this.toBBox(a),
                    g = [],
                    h = this._chooseSubtree(f, d || this.data, b, g);
                h.children.push(a), this._extend(h.bbox, f);
                do e = !1, g[b].children.length > this._maxEntries && (this._split(g, b), e = !0, b--); while (b >= 0 && e);
                this._adjustParentBBoxes(f, g, b)
            },
            _split: function(a, b) {
                var c = a[b],
                    d = c.children.length,
                    e = this._minEntries;
                this._chooseSplitAxis(c, e, d);
                var f = {
                    children: c.children.splice(this._chooseSplitIndex(c, e, d)),
                    height: c.height
                };
                c.leaf && (f.leaf = !0), this._calcBBox(c), this._calcBBox(f), b ? a[b - 1].children.push(f) : this._splitRoot(c, f)
            },
            _splitRoot: function(a, b) {
                this.data = {}, this.data.children = [a, b], this.data.height = a.height + 1, this._calcBBox(this.data)
            },
            _chooseSplitIndex: function(a, b, c) {
                var d, e, f, g, h, i, j, k;
                for (i = j = 1 / 0, d = b; c - b >= d; d++) e = this._distBBox(a, 0, d), f = this._distBBox(a, d, c), g = this._intersectionArea(e, f), h = this._area(e) + this._area(f), i > g ? (i = g, k = d, j = j > h ? h : j) : g === i && j > h && (j = h, k = d);
                return k
            },
            _chooseSplitAxis: function(a, b, c) {
                var d = a.leaf ? this.compareMinX : this._compareNodeMinX,
                    e = a.leaf ? this.compareMinY : this._compareNodeMinY,
                    f = this._allDistMargin(a, b, c, d),
                    g = this._allDistMargin(a, b, c, e);
                g > f && a.children.sort(d)
            },
            _allDistMargin: function(a, b, c, d) {
                a.children.sort(d);
                var e, f, g = this._distBBox(a, 0, b),
                    h = this._distBBox(a, c - b, c),
                    i = this._margin(g) + this._margin(h);
                for (e = b; c - b > e; e++) f = a.children[e], this._extend(g, a.leaf ? this.toBBox(f) : f.bbox), i += this._margin(g);
                for (e = c - b - 1; e >= 0; e--) f = a.children[e], this._extend(h, a.leaf ? this.toBBox(f) : f.bbox), i += this._margin(h);
                return i
            },
            _distBBox: function(a, b, c) {
                for (var d, e = this._empty(), f = b; c > f; f++) d = a.children[f], this._extend(e, a.leaf ? this.toBBox(d) : d.bbox);
                return e
            },
            _calcBBox: function(a) {
                a.bbox = this._empty();
                for (var b, c = 0, d = a.children.length; d > c; c++) b = a.children[c], this._extend(a.bbox, a.leaf ? this.toBBox(b) : b.bbox)
            },
            _adjustParentBBoxes: function(a, b, c) {
                for (var d = c; d >= 0; d--) this._extend(b[d].bbox, a)
            },
            _condense: function(a) {
                for (var b, c = a.length - 1; c >= 0; c--) 0 === a[c].children.length ? c > 0 ? (b = a[c - 1].children, b.splice(b.indexOf(a[c]), 1)) : this.clear() : this._calcBBox(a[c])
            },
            _contains: function(a, b) {
                return a[0] <= b[0] && a[1] <= b[1] && b[2] <= a[2] && b[3] <= a[3]
            },
            _intersects: function(a, b) {
                return b[0] <= a[2] && b[1] <= a[3] && b[2] >= a[0] && b[3] >= a[1]
            },
            _extend: function(a, b) {
                return a[0] = Math.min(a[0], b[0]), a[1] = Math.min(a[1], b[1]), a[2] = Math.max(a[2], b[2]), a[3] = Math.max(a[3], b[3]), a
            },
            _area: function(a) {
                return (a[2] - a[0]) * (a[3] - a[1])
            },
            _margin: function(a) {
                return a[2] - a[0] + (a[3] - a[1])
            },
            _enlargedArea: function(a, b) {
                return (Math.max(b[2], a[2]) - Math.min(b[0], a[0])) * (Math.max(b[3], a[3]) - Math.min(b[1], a[1]))
            },
            _intersectionArea: function(a, b) {
                var c = Math.max(a[0], b[0]),
                    d = Math.max(a[1], b[1]),
                    e = Math.min(a[2], b[2]),
                    f = Math.min(a[3], b[3]);
                return Math.max(0, e - c) * Math.max(0, f - d)
            },
            _empty: function() {
                return [1 / 0, 1 / 0, -1 / 0, -1 / 0]
            },
            _compareNodeMinX: function(a, b) {
                return a.bbox[0] - b.bbox[0]
            },
            _compareNodeMinY: function(a, b) {
                return a.bbox[1] - b.bbox[1]
            },
            _initFormat: function(a) {
                var b = ["return a", " - b", ";"];
                this.compareMinX = new Function("a", "b", b.join(a[0])), this.compareMinY = new Function("a", "b", b.join(a[1])), this.toBBox = new Function("a", "return [a" + a.join(", a") + "];")
            }
        }, L.esri._rbush = a
    }(L),
    function(L) {
        var a = "https:" !== window.location.protocol ? "http:" : "https:",
            b = "line-height:9px; text-overflow:ellipsis; white-space:nowrap;overflow:hidden; display:inline-block;",
            c = "position:absolute; top:-38px; right:2px;",
            d = "<img src='https://serverapi.arcgisonline.com/jsapi/arcgis/3.5/js/esri/images/map/logo-med.png' alt='Powered by Esri' class='esri-attribution-logo' style='" + c + "'>",
            e = function(a) {
                return "<span class='esri-attributions' style='" + b + "'>" + a + "</span>"
            };
        L.esri.BasemapLayer = L.TileLayer.extend({
            statics: {
                TILES: {
                    Streets: {
                        urlTemplate: a + "//{s}.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
                        attributionUrl: "https://static.arcgis.com/attribution/World_Street_Map",
                        options: {
                            minZoom: 1,
                            maxZoom: 19,
                            subdomains: ["server", "services"],
                            attribution: e("Esri") + d
                        }
                    },
                    Topographic: {
                        urlTemplate: a + "//{s}.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
                        attributionUrl: "https://static.arcgis.com/attribution/World_Topo_Map",
                        options: {
                            minZoom: 1,
                            maxZoom: 19,
                            subdomains: ["server", "services"],
                            attribution: e("Esri") + d
                        }
                    },
                    Oceans: {
                        urlTemplate: a + "//server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}",
                        attributionUrl: "https://static.arcgis.com/attribution/Ocean_Basemap",
                        options: {
                            minZoom: 1,
                            maxZoom: 16,
                            subdomains: ["server", "services"],
                            attribution: e("Esri") + d
                        }
                    },
                    NationalGeographic: {
                        urlTemplate: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 16,
                            subdomains: ["server", "services"],
                            attribution: e("Esri") + d
                        }
                    },
                    DarkGray: {
                        urlTemplate: a + "//tiles{s}.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Dark_Gray_Base_Beta/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 10,
                            subdomains: [1, 2],
                            attribution: e("Esri, DeLorme, HERE") + d
                        }
                    },
                    DarkGrayLabels: {
                        urlTemplate: a + "//tiles{s}.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Dark_Gray_Reference_Beta/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 10,
                            subdomains: [1, 2]
                        }
                    },
                    Gray: {
                        urlTemplate: a + "//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 16,
                            subdomains: ["server", "services"],
                            attribution: e("Esri, NAVTEQ, DeLorme") + d
                        }
                    },
                    GrayLabels: {
                        urlTemplate: a + "//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 16,
                            subdomains: ["server", "services"]
                        }
                    },
                    Imagery: {
                        urlTemplate: a + "//{s}.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 19,
                            subdomains: ["server", "services"],
                            attribution: e("Esri, DigitalGlobe, GeoEye, i-cubed, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community") + d
                        }
                    },
                    ImageryLabels: {
                        urlTemplate: a + "//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 19,
                            subdomains: ["server", "services"]
                        }
                    },
                    ImageryTransportation: {
                        urlTemplate: a + "//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 19,
                            subdomains: ["server", "services"]
                        }
                    },
                    ShadedRelief: {
                        urlTemplate: a + "//{s}.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 13,
                            subdomains: ["server", "services"],
                            attribution: e("ESRI, NAVTEQ, DeLorme") + d
                        }
                    },
                    ShadedReliefLabels: {
                        urlTemplate: a + "//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 12,
                            subdomains: ["server", "services"]
                        }
                    },
                    Terrain: {
                        urlTemplate: a + "//{s}.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 13,
                            subdomains: ["server", "services"],
                            attribution: e("Esri, USGS, NOAA") + d
                        }
                    },
                    TerrainLabels: {
                        urlTemplate: a + "//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}",
                        options: {
                            minZoom: 1,
                            maxZoom: 13,
                            subdomains: ["server", "services"]
                        }
                    }
                }
            },
            initialize: function(a, b) {
                var c;
                if ("object" == typeof a && a.urlTemplate && a.options) c = a;
                else {
                    if ("string" != typeof a || !L.esri.BasemapLayer.TILES[a]) throw new Error("L.esri.BasemapLayer: Invalid parameter. Use one of 'Streets', 'Topographic', 'Oceans', 'NationalGeographic', 'Gray', 'GrayLabels', 'DarkGray', 'DarkGrayLabels', 'Imagery', 'ImageryLabels', 'ImageryTransportation', 'ShadedRelief' or 'ShadedReliefLabels'");
                    c = L.esri.BasemapLayer.TILES[a]
                }
                var d = L.Util.extend(c.options, b);
                if (L.TileLayer.prototype.initialize.call(this, c.urlTemplate, L.Util.setOptions(this, d)), c.attributionUrl) {
                    var e = c.attributionUrl;
                    this._dynamicAttribution = !0, this._getAttributionData(e)
                }
            },
            _dynamicAttribution: !1,
            bounds: null,
            zoom: null,
            onAdd: function(a) {
                return !a.attributionControl && console ? (console.warn("L.esri.BasemapLayer requires attribution. Please set attributionControl to true on your map"), void 0) : (L.TileLayer.prototype.onAdd.call(this, a), this._dynamicAttribution && (this.on("load", this._handleTileUpdates, this), this._map.on("viewreset zoomend dragend", this._handleTileUpdates, this)), this._map.on("resize", this._resizeAttribution, this), void 0)
            },
            onRemove: function(a) {
                this._dynamicAttribution && (this.off("load", this._handleTileUpdates, this), this._map.off("viewreset zoomend dragend", this._handleTileUpdates, this)), this._map.off("resize", this._resizeAttribution, this), L.TileLayer.prototype.onRemove.call(this, a)
            },
            _handleTileUpdates: function(a) {
                var b, c;
                "load" === a.type && (b = this._map.getBounds(), c = this._map.getZoom()), ("viewreset" === a.type || "dragend" === a.type || "zoomend" === a.type) && (b = a.target.getBounds(), c = a.target.getZoom()), this.attributionBoundingBoxes && b && c && (b.equals(this.bounds) && c === this.zoom || (this.bounds = b, this.zoom = c, this._updateMapAttribution()))
            },
            _resizeAttribution: function() {
                var a = this._map.getSize().x;
                this._getAttributionLogo().style.display = 600 > a ? "none" : "block", this._getAttributionSpan().style.maxWidth = .75 * a + "px"
            },
            _getAttributionData: function(a) {
                this.attributionBoundingBoxes = [], L.esri.RequestHandlers.JSONP(a, {}, this._processAttributionData, this)
            },
            _processAttributionData: function(a) {
                for (var b = 0; b < a.contributors.length; b++)
                    for (var c = a.contributors[b], d = 0; d < c.coverageAreas.length; d++) {
                        var e = c.coverageAreas[d],
                            f = new L.LatLng(e.bbox[0], e.bbox[1]),
                            g = new L.LatLng(e.bbox[2], e.bbox[3]);
                        this.attributionBoundingBoxes.push({
                            attribution: c.attribution,
                            score: e.score,
                            bounds: new L.LatLngBounds(f, g),
                            minZoom: e.zoomMin,
                            maxZoom: e.zoomMax
                        })
                    }
                this.attributionBoundingBoxes.sort(function(a, b) {
                    return a.score < b.score ? -1 : a.score > b.score ? 1 : 0
                }), this.bounds && this._updateMapAttribution()
            },
            _getAttributionSpan: function() {
                return this._map._container.querySelectorAll(".esri-attributions")[0]
            },
            _getAttributionLogo: function() {
                return this._map._container.querySelectorAll(".esri-attribution-logo")[0]
            },
            _updateMapAttribution: function() {
                for (var a = "", b = 0; b < this.attributionBoundingBoxes.length; b++) {
                    var c = this.attributionBoundingBoxes[b];
                    if (this.bounds.intersects(c.bounds) && this.zoom >= c.minZoom && this.zoom <= c.maxZoom) {
                        var d = this.attributionBoundingBoxes[b].attribution; - 1 === a.indexOf(d) && (a.length > 0 && (a += ", "), a += d)
                    }
                }
                this._getAttributionSpan().innerHTML = a, this._resizeAttribution()
            }
        }), L.esri.basemapLayer = function(a, b) {
            return new L.esri.BasemapLayer(a, b)
        }
    }(L),
    function(L) {
        function a(a, b) {
            var c = b ? "block" : "none";
            if (a._icon && (a._icon.style.display = c), a._shadow && (a._shadow.style.display = c), a._layers)
                for (var d in a._layers) a._layers.hasOwnProperty(d) && (a._layers[d]._container.style.display = c)
        }
        L.esri.FeatureLayer = L.GeoJSON.extend({
            includes: L.esri.Mixins.featureGrid,
            options: {
                cellSize: 512,
                debounce: 100,
                deduplicate: !0,
                where: "1=1",
                fields: ["*"]
            },
            initialize: function(a, b) {
                this.index = L.esri._rbush(), this.url = L.esri.Util.cleanUrl(a), L.Util.setOptions(this, b), L.Util.setOptions(this, b), this._getMetadata(), L.GeoJSON.prototype.initialize.call(this, [], b)
            },
            onAdd: function(a) {
                this._updateHandler = L.esri.Util.debounce(this._update, this.options.debounce), L.LayerGroup.prototype.onAdd.call(this, a), a.on("zoomend resize moveend", this._updateHandler, this), this._initializeFeatureGrid(a)
            },
            onRemove: function(a) {
                a.off("zoomend resize moveend", this._updateHandler, this), L.LayerGroup.prototype.onRemove.call(this, a), this._destroyFeatureGrid(a)
            },
            getLayerId: function(a) {
                return a.feature.id
            },
            getWhere: function() {
                return this.options.where
            },
            setWhere: function(a) {
                return this.options.where = a, this.refresh(), this
            },
            getFields: function() {
                return this.options.fields
            },
            setFields: function(a) {
                return this.options.fields = a, this.refresh(), this
            },
            refresh: function() {
                this.clearLayers(), this._loaded = [], this._previousCells = [], this._requestFeatures(this._map.getBounds())
            },
            _update: function(b) {
                L.esri.Util.boundsToEnvelope(b.target.getBounds());
                for (var c = this.index.search(b.target.getBounds().toBBoxString().split(",")), d = [], e = 0; e < c.length; e++) d.push(c[e][4]);
                this.eachLayer(L.Util.bind(function(b) {
                    var c = b.feature.id;
                    a(b, L.esri.Util.indexOf(d, c) >= 0)
                }, this))
            },
            _setObjectIdField: function(a) {
                if (a.objectIdFieldName) this._objectIdField = a.objectIdFieldName;
                else
                    for (var b = 0; b <= a.fields.length - 1; b++)
                        if ("esriFieldTypeOID" === a.fields[b].type) {
                            this._objectIdField = a.fields[b].name;
                            break
                        }
            },
            _render: function(a) {
                if (a.features && a.features.length && !a.error) {
                    this._objectIdField || this._setObjectIdField(a);
                    for (var b = [], c = a.features.length - 1; c >= 0; c--) {
                        var d = a.features[c],
                            e = d.attributes[this._objectIdField];
                        if (!this._layers[e]) {
                            var f = L.esri.Util.arcgisToGeojson(d, {
                                    idAttribute: this._objectIdField
                                }),
                                g = L.esri.Util.geojsonBounds(f);
                            g.push(f.id), b.push(g), this.addData(f)
                        }
                    }
                    this.index.load(b)
                }
            }
        }), L.esri.FeatureLayer.include(L.esri.Mixins.metadata), L.esri.featureLayer = function(a, b) {
            return new L.esri.FeatureLayer(a, b)
        }
    }(L), L.esri.TiledMapLayer = L.TileLayer.extend({
        includes: L.esri.Mixins.identifiableLayer,
        initialize: function(a, b) {
            b = b || {}, this.url = L.esri.Util.cleanUrl(a), this.tileUrl = L.esri.Util.cleanUrl(a) + "tile/{z}/{y}/{x}", this.tileUrl.match("://tiles.arcgis.com") && (this.tileUrl = this.tileUrl.replace("://tiles.arcgis.com", "://tiles{s}.arcgis.com"), b.subdomains = ["1", "2", "3", "4"]), L.Util.setOptions(this, b), this._getMetadata(), L.TileLayer.prototype.initialize.call(this, this.tileUrl, b)
        }
    }), L.esri.TiledMapLayer.include(L.esri.Mixins.metadata), L.esri.tiledMapLayer = function(a, b) {
        return new L.esri.TiledMapLayer(a, b)
    },
    /*!
     * The MIT License (MIT)
     *
     * Copyright (c) 2013 Sanborn Map Company, Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    L.esri.DynamicMapLayer = L.Class.extend({
        includes: L.esri.Mixins.identifiableLayer,
        options: {
            opacity: 1,
            position: "front"
        },
        _defaultLayerParams: {
            format: "png24",
            transparent: !0,
            f: "image",
            bboxSR: 3875,
            imageSR: 3875,
            layers: "",
            layerDefs: ""
        },
        initialize: function(a, b) {
            this.url = L.esri.Util.cleanUrl(a), this._layerParams = L.Util.extend({}, this._defaultLayerParams);
            for (var c in b) b.hasOwnProperty(c) && this._defaultLayerParams.hasOwnProperty(c) && (this._layerParams[c] = b[c]);
            this._parseLayers(), this._parseLayerDefs(), L.Util.setOptions(this, b), this._getMetadata(), this._layerParams.transparent || (this.options.opacity = 1)
        },
        onAdd: function(a) {
            if (this._map = a, this._moveHandler = L.esri.Util.debounce(this._update, 150, this), a.on("moveend", this._moveHandler, this), a.options.crs && a.options.crs.code) {
                var b = a.options.crs.code.split(":")[1];
                this._layerParams.bboxSR = b, this._layerParams.imageSR = b
            }
            this._update()
        },
        onRemove: function(a) {
            this._currentImage && this._map.removeLayer(this._currentImage), a.off("moveend", this._moveHandler, this)
        },
        addTo: function(a) {
            return a.addLayer(this), this
        },
        setOpacity: function(a) {
            this.options.opacity = a, this._currentImage.setOpacity(a)
        },
        bringToFront: function() {
            return this.options.position = "front", this._currentImage.bringToFront(), this
        },
        bringToBack: function() {
            return this.options.position = "back", this._currentImage.bringToBack(), this
        },
        _parseLayers: function() {
            if ("undefined" == typeof this._layerParams.layers) return delete this._layerParams.layerOption, void 0;
            var a = this._layerParams.layerOption || null,
                b = this._layerParams.layers || null,
                c = "show",
                d = ["show", "hide", "include", "exclude"];
            if (delete this._layerParams.layerOption, a) - 1 !== d.indexOf(a) && (c = a), this._layerParams.layers = c + ":" + b;
            else if (b instanceof Array) this._layerParams.layers = c + ":" + b.join(",");
            else if ("string" == typeof b) {
                var e = b.match(":");
                e && (b = b.split(e[0]), Number(b[1].split(",")[0]) && (-1 !== d.indexOf(b[0]) && (c = b[0]), b = b[1])), this._layerParams.layers = c + ":" + b
            }
        },
        _parseLayerDefs: function() {
            if ("undefined" != typeof this._layerParams.layerDefs) {
                var a = this._layerParams.layerDefs,
                    b = [];
                if (a instanceof Array)
                    for (var c = a.length, d = 0; c > d; d++) a[d] && b.push(d + ":" + a[d]);
                else {
                    if ("object" != typeof a) return delete this._layerParams.layerDefs, void 0;
                    for (var e in a) a.hasOwnProperty(e) && b.push(e + ":" + a[e])
                }
                this._layerParams.layerDefs = b.join(";")
            }
        },
        _getImageUrl: function() {
            var a = this._map.getBounds(),
                b = this._map.getSize(),
                c = this._map.options.crs.project(a._northEast),
                d = this._map.options.crs.project(a._southWest);
            this._layerParams.bbox = [d.x, d.y, c.x, c.y].join(","), this._layerParams.size = b.x + "," + b.y, this.options.token && (this._layerParams.token = this.options.token);
            var e = this.url + "export" + L.Util.getParamString(this._layerParams);
            return e
        },
        _update: function() {
            if (!(this._animatingZoom || this._map._panTransition && this._map._panTransition._inProgress)) {
                var a = this._map.getZoom();
                if (!(a > this.options.maxZoom || a < this.options.minZoom)) {
                    var b = this._map.getBounds();
                    b._southWest.wrap(), b._northEast.wrap();
                    var c = new L.ImageOverlay(this._getImageUrl(), b, {
                        opacity: 0
                    }).addTo(this._map);
                    c.on("load", function(a) {
                        var c = a.target,
                            d = this._currentImage;
                        c._bounds.equals(b) ? (this._currentImage = c, "front" === this.options.position ? this._currentImage.bringToFront() : this._currentImage.bringToBack(), this._currentImage.setOpacity(this.options.opacity), d && this._map.removeLayer(d)) : this._map.removeLayer(c)
                    }, this), this.fire("loading", {
                        bounds: b
                    })
                }
            }
        }
    }), L.esri.DynamicMapLayer.include(L.Mixin.Events), L.esri.DynamicMapLayer.include(L.esri.Mixins.metadata), L.esri.dynamicMapLayer = function(a, b) {
        return new L.esri.DynamicMapLayer(a, b)
    };