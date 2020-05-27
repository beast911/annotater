"use strict";
/**
 * Example config 
 * {
    imageSrc: "",
    containerId: "image-container",
    zoomInId: "zoomin",
    zoomOutId: "zoomout",
    resetId: "reset"
   }
 */
(function (window) {
    // data structures
    let onDrag = false;
    let listRegionCoordinates = [];
    let canvasCtx = null;
    let zoomScale = 1;
    let zoomOffset = 1;
    let currentRegionCoordinates = null;
    let RegionCoordinates = function (x1, x2, y1, y2) {
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
    }
    let Annotater = function (config) {
        this.config = config;
        if (!setup(config)) {
            console.log("No annotations setup");
        }
    }
    function zoom(imageId, zoomincrement) {
        zoomScale = zoomScale * zoomincrement;
        zoomOffset = zoomOffset * zoomincrement;
        let img_ele = document.getElementById(imageId);
        let pre_width = img_ele.getBoundingClientRect().width, pre_height = img_ele.getBoundingClientRect().height;
        img_ele.style.width = (pre_width * zoomincrement) + 'px';
        img_ele.style.height = (pre_height * zoomincrement) + 'px';
        // update canvas width and height and scale existing annotations
        canvasCtx.canvas.height = pre_height * zoomincrement;
        canvasCtx.canvas.width = pre_width * zoomincrement;
        if (currentRegionCoordinates) {
            canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
            canvasCtx.strokeStyle = "yellow";
            draw_rect(
                getInitPoint(currentRegionCoordinates).x * zoomOffset,
                getInitPoint(currentRegionCoordinates).y * zoomOffset,
                Math.abs(currentRegionCoordinates.x1 - currentRegionCoordinates.x2) * zoomOffset,
                Math.abs(currentRegionCoordinates.y1 - currentRegionCoordinates.y2) * zoomOffset
            );
        }
        if (listRegionCoordinates) {
            drawExistingRegions();
        }
        img_ele = null;
    }

    function resetSize(imageId) {
        let img_ele = document.getElementById(imageId);
        img_ele.style.width = "100%";
        img_ele.style.height = "100%";
        // reset canvas width and height
        img_ele.style.left = 0;
        img_ele.style.top = 0;
        img_ele = null;
    }

    function onMouseDown(e) {
        currentRegionCoordinates = new RegionCoordinates();
        currentRegionCoordinates.x1 = e.clientX + e.currentTarget.parentElement.scrollLeft;
        currentRegionCoordinates.y1 = e.clientY + e.currentTarget.parentElement.scrollTop;
        onDrag = true;
    }

    function onMouseMove(e) {
        if (!onDrag) {
            return;
        }
        currentRegionCoordinates.x2 = e.clientX + e.currentTarget.parentElement.scrollLeft;
        currentRegionCoordinates.y2 = e.clientY + e.currentTarget.parentElement.scrollTop;
        let reg_x = currentRegionCoordinates.x2;
        let reg_y = currentRegionCoordinates.y2;
        if (currentRegionCoordinates.x1 < e.offsetX) {
            reg_x = currentRegionCoordinates.x1;
            if (currentRegionCoordinates.y1 < currentRegionCoordinates.y2) {
                reg_y = currentRegionCoordinates.y1;
            } else {
                reg_y = currentRegionCoordinates.y2;
            }
        } else {
            reg_x = currentRegionCoordinates.x2;
            if (currentRegionCoordinates.y1 < currentRegionCoordinates.y2) {
                reg_y = currentRegionCoordinates.y1;
            } else {
                reg_y = currentRegionCoordinates.y2;
            }
        }
        // clear intermediate rectangles
        canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
        if (listRegionCoordinates.length > 0) {
            drawExistingRegions();
        }
        canvasCtx.strokeStyle = "yellow";
        console.log(e.offsetX);
        console.log(currentRegionCoordinates);
        draw_rect(
            reg_x,
            reg_y,
            Math.abs(currentRegionCoordinates.x1 - currentRegionCoordinates.x2),
            Math.abs(currentRegionCoordinates.y1 - currentRegionCoordinates.y2)
        );
    }

    function drawExistingRegions() {
        canvasCtx.strokeStyle = "red";
        listRegionCoordinates.forEach(item => {
            draw_rect(
                getInitPoint(item).x * zoomScale,
                getInitPoint(item).y * zoomScale,
                Math.abs(item.x1 - item.x2) * zoomScale,
                Math.abs(item.y1 - item.y2) * zoomScale
            );
        })
    }

    /**
     * Load existing/other annotations for the loaded image
     * @param {Array} shape_attrs 
     */
    function loadExistingAnnotations(shape_attrs) {
        canvasCtx.strokeStyle = "red";
        listRegionCoordinates = shape_attrs;
        drawExistingRegions();
    }

    function getInitPoint(coordinates) {
        let reg_x = coordinates.x2;
        let reg_y = coordinates.y2;
        if (coordinates.x1 < coordinates.x2) {
            reg_x = coordinates.x1;
            if (coordinates.y1 < coordinates.y2) {
                reg_y = coordinates.y1;
            }
        } else {
            if (coordinates.y1 < coordinates.y2) {
                reg_y = coordinates.y1;
            }
        }
        return {
            x: reg_x,
            y: reg_y
        }
    }

    /**
     * Draw rectangle
     * @param {Integer} x 
     * @param {Integer} y 
     * @param {Integer} dx 
     * @param {Integer} dy 
     */
    function draw_rect(x, y, dx, dy) {
        canvasCtx.beginPath();
        canvasCtx.rect(x, y, dx, dy);
        canvasCtx.closePath();
        canvasCtx.stroke();
    }

    /**
     * Function to prepare image and canvas for annotations
     * @param {Object} config Set of configurations to load image and canvas
     */
    function setup(config) {
        if (!(config && config.imageSrc && config.containerId)) {
            console.error("[Annotater] Configuration error: something missing in the config. Please check");
            return false;
        }
        // Parse config to get {imageSrc, containerId, zoom actions id}
        const imageContainerId = document.getElementById(config.containerId);

        const canvasEl = document.createElement('canvas');
        canvasEl.setAttribute("id", "canvas");
        canvasEl.style.position = "absolute";

        const imageEl = document.createElement('img');
        imageEl.setAttribute('src', config.imageSrc);
        imageEl.style.position = "absolute";
        imageEl.style.objectFit = "contain";
        imageEl.setAttribute("id", "image");
        imageEl.onload = function () {
            canvasCtx = canvasEl.getContext('2d');
            canvasCtx.canvas.height = imageEl.height;
            canvasCtx.canvas.width = imageEl.width;
            canvasCtx.strokeStyle = "red";
            attachCanvasEvents();
        }

        imageContainerId.appendChild(imageEl);
        imageContainerId.appendChild(canvasEl);
        // Bind zoom events
        attachEvents(config);
        return true;
    }

    /**
     * Get current coordinates of the annotation
     */
    function getCurrentCoordinates() {
        return currentRegionCoordinates;
    }

    function attachCanvasEvents() {
        window.addEventListener('mouseup', function (e) {
            if (onDrag) {
                zoomOffset = 1;
                onDrag = false;
            }
        });
        canvasCtx.canvas.addEventListener('mousedown', onMouseDown);
        canvasCtx.canvas.addEventListener('mousemove', onMouseMove);
    }

    function attachEvents(config) {
        document.getElementById(config.zoomOutId).addEventListener('click',
            zoom.bind(this, 'image', 0.95)
        );
        document.getElementById(config.zoomInId).addEventListener('click',
            zoom.bind(this, 'image', 1.05)
        );
        document.getElementById(config.resetId).addEventListener('click',
            resetSize.bind(this, 'image')
        );
    }

    function download() {
        let link = document.createElement('a');
        let c = document.createElement('canvas');
        c.width = canvasCtx.canvas.width;
        c.height = canvasCtx.canvas.height;
        let ct = c.getContext('2d');
        let img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
            ct.drawImage(img, 0, 0, c.width, c.height);
            ct.drawImage(document.getElementById('canvas'), 0, 0);
            let saved_image = c.toDataURL();
            link.download = 'filename.png';
            link.href = saved_image;
            link.click()
        }
        img.src = this.config.imageSrc;
    }

    Annotater.prototype = {
        constructor: Annotater,
        loadAnnotations: function (shape_attrs) {
            if (!shape_attrs || !Array.isArray(shape_attrs)) {
                console.log("[Annotater] no co-ordinates provided");
                return;
            }
            loadExistingAnnotations(shape_attrs);
        },
        getCurrentAnnotation: getCurrentCoordinates,
        downloadImageWithAnnotations: download
    }
    window.Annotater = Annotater;
})(window);
