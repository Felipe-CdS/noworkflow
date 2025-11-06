import {
  select as d3_select,
  Selection as d3_Selection,
  BaseType as d3_BaseType,
} from "d3-selection";

import { Widget } from "@lumino/widgets";
import { instance } from "@viz-js/viz";
import * as fs from "file-saver";

declare var require: any;
const svgPanZoom = require("svg-pan-zoom");

export class ProspectiveGraphWidget extends Widget {
  name: string;
  cls: string;
  trialId: string;
  d3node: d3_Selection<d3_BaseType, {}, HTMLElement | null, any>;
  dotContent: string | null;

  static url(trialId: string): string {
    return `trials/${trialId}/prospective.dot`;
  }

  constructor(name: string, cls: string, trialId: string) {
    super({ node: ProspectiveGraphWidget.createNode(cls) });
    this.d3node = d3_select(this.node);
    this.addClass("content");
    this.addClass("prospective-widget");
    this.title.label = name;
    this.title.closable = true;
    this.title.caption = `${name} Prospective Graph`;
    this.name = name;
    this.cls = cls;
    this.trialId = trialId;
    this.dotContent = null;

    // Add toolbar
    this.createToolbar();
  }

  static createNode(cls: string): HTMLElement {
    let node = document.createElement("div");
    let d3node = d3_select(node);

    // Set up container to take full space
    node.style.display = "flex";
    node.style.flexDirection = "column";
    node.style.width = "100%";
    node.style.height = "100%";
    node.style.overflow = "hidden";

    d3node.append("div")
      .classed("prospective-toolbar", true)
      .style("flex-shrink", "0")
      .style("height", "30px")
      .style("min-height", "30px")
      .style("max-height", "30px")
      .style("padding", "2px 5px")
      .style("background", "#f5f5f5")
      .style("border-bottom", "1px solid #ddd")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "8px");

    d3node.append("div")
      .classed("prospective-content", true)
      .style("flex", "1")
      .style("min-height", "0")
      .style("overflow", "hidden")
      .style("position", "relative");

    return node;
  }

  createToolbar() {
    let toolbar = this.d3node.select(".prospective-toolbar");

    // Download SVG button
    toolbar
      .append("a")
      .classed("toollink", true)
      .attr("href", "#")
      .attr("title", "Download graph SVG")
      .style("padding", "4px 8px")
      .style("text-decoration", "none")
      .style("color", "#333")
      .style("font-size", "14px")
      .on("click", () => {
        this.downloadSVG();
      })
      .append("i")
      .classed("fa fa-download", true);

    // Download DOT button
    toolbar
      .append("a")
      .classed("toollink", true)
      .attr("href", "#")
      .attr("title", "Download graph DOT")
      .style("padding", "4px 8px")
      .style("text-decoration", "none")
      .style("color", "#333")
      .style("font-size", "14px")
      .on("click", () => {
        this.downloadDOT();
      })
      .append("i")
      .classed("fa fa-file-text", true);
  }

  load() {
    let contentDiv = this.node.getElementsByClassName("prospective-content")[0];

    // Show loading state
    contentDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px;">
        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 20px; color: #666;">Loading prospective provenance for trial ${this.trialId}...</p>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;

    // Fetch DOT content from backend
    const url = ProspectiveGraphWidget.url(this.trialId);

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          return response.text().then((errorText) => {
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          });
        }
        return response.text();
      })
      .then((dotContent) => {
        console.log("Successfully fetched prospective provenance DOT");
        this.dotContent = dotContent;
        this.renderGraph(dotContent, contentDiv);
      })
      .catch((error) => {
        console.error("Error fetching prospective provenance:", error);
        // Show error message in graph area
        contentDiv.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px; text-align: center;">
            <i class="fa fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c; margin-bottom: 20px;"></i>
            <h3 style="color: #e74c3c; margin: 0 0 10px 0;">Failed to Load Prospective Provenance</h3>
            <p style="color: #666; margin: 0 0 10px 0; max-width: 500px;">
              Could not fetch prospective provenance for trial <code>${this.trialId}</code>
            </p>
            <p style="color: #999; margin: 0; font-size: 0.9em; max-width: 500px;">
              ${error.message}
            </p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Reload Page
            </button>
          </div>
        `;
      });
  }

  renderGraph(dotContent: string, container: Element) {
    console.log("Rendering prospective graph...");
    console.log("DOT content length:", dotContent.length);
    instance()
      .then((viz) => {
        console.log("Viz.js instance loaded");
        container.innerHTML = "";
        let svgElement = viz.renderSVGElement(dotContent);
        console.log("SVG element created:", svgElement);
        console.log(
          "SVG element dimensions:",
          svgElement.clientWidth,
          svgElement.clientHeight,
        );
        console.log("SVG viewBox:", svgElement.getAttribute("viewBox"));
        console.log(
          "Container dimensions:",
          (container as HTMLElement).clientWidth,
          (container as HTMLElement).clientHeight,
        );

        // Apply initial zoom by adjusting viewBox
        const viewBoxAttr = svgElement.getAttribute("viewBox");
        if (viewBoxAttr) {
          const values = viewBoxAttr.split(" ").map(parseFloat);
          const x = values[0];
          const y = values[1];
          const width = values[2];
          const height = values[3];

          // Zoom in by reducing viewBox dimensions (50% = 2x zoom)
          const zoomFactor = 0.6; // 0.6 = ~1.67x zoom (adjust between 0.5-0.8)
          const newWidth = width * zoomFactor;
          const newHeight = height * zoomFactor;

          // Center the zoomed view
          const newX = x + (width - newWidth) / 2;
          const newY = y + (height - newHeight) / 2;

          svgElement.setAttribute("viewBox", `${newX} ${newY} ${newWidth} ${newHeight}`);
          console.log("Applied initial zoom, new viewBox:", svgElement.getAttribute("viewBox"));
        }

        // Style SVG to fill container completely
        svgElement.style.width = "100%";
        svgElement.style.height = "100%";
        svgElement.style.display = "block";
        svgElement.style.position = "absolute";
        svgElement.style.top = "0";
        svgElement.style.left = "0";

        container.appendChild(svgElement);
        console.log("SVG appended to container");

        // Add simple pan functionality
        this.addPanFunctionality(svgElement);
      })
      .catch((error) => {
        console.error("Error rendering prospective graph:", error);
        container.innerHTML = "<p>Error rendering graph: " + error + "</p>";
      });
  }

  addPanFunctionality(svgElement: SVGSVGElement) {
    let isPanning = false;
    let startPoint = { x: 0, y: 0 };
    let endPoint = { x: 0, y: 0 };
    let viewBox = { x: 0, y: 0, width: 0, height: 0 };

    // Get initial viewBox
    const viewBoxAttr = svgElement.getAttribute("viewBox");
    if (viewBoxAttr) {
      const values = viewBoxAttr.split(" ").map(parseFloat);
      viewBox = {
        x: values[0],
        y: values[1],
        width: values[2],
        height: values[3],
      };
    } else {
      // If no viewBox, create one from SVG dimensions
      const bbox = svgElement.getBBox();
      viewBox = {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
      };
      svgElement.setAttribute(
        "viewBox",
        `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
      );
    }

    svgElement.style.cursor = "grab";

    svgElement.addEventListener("mousedown", (e: MouseEvent) => {
      isPanning = true;
      startPoint = { x: e.clientX, y: e.clientY };
      endPoint = { x: viewBox.x, y: viewBox.y };
      svgElement.style.cursor = "grabbing";
      e.preventDefault();
    });

    svgElement.addEventListener("mousemove", (e: MouseEvent) => {
      if (!isPanning) return;

      const dx =
        (e.clientX - startPoint.x) * (viewBox.width / svgElement.clientWidth);
      const dy =
        (e.clientY - startPoint.y) * (viewBox.height / svgElement.clientHeight);

      viewBox.x = endPoint.x - dx;
      viewBox.y = endPoint.y - dy;

      svgElement.setAttribute(
        "viewBox",
        `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
      );
    });

    svgElement.addEventListener("mouseup", () => {
      isPanning = false;
      svgElement.style.cursor = "grab";
    });

    svgElement.addEventListener("mouseleave", () => {
      isPanning = false;
      svgElement.style.cursor = "grab";
    });
  }

  downloadSVG() {
    if (this.dotContent) {
      instance().then((viz) => {
        let svgElement = viz.renderSVGElement(this.dotContent!);
        fs.saveAs(
          new Blob([svgElement.outerHTML], { type: "image/svg+xml" }),
          "prospective_" + this.trialId + ".svg",
        );
      });
    }
  }

  downloadDOT() {
    if (this.dotContent) {
      fs.saveAs(
        new Blob([this.dotContent], { type: "text/plain;charset=utf-8" }),
        "prospective_" + this.trialId + ".dot",
      );
    }
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    // Resize is handled automatically via flexbox layout
    // SVG uses 100% width/height with position: absolute
    // No manual intervention needed
  }
}
