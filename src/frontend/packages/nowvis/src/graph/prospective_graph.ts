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

    d3node.append("div").classed("prospective-toolbar", true);

    d3node.append("div").classed("prospective-content", true);

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
      .style("margin-right", "10px")
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
      .style("margin-right", "10px")
      .on("click", () => {
        this.downloadDOT();
      })
      .append("i")
      .classed("fa fa-file-text", true);
  }

  load() {
    let contentDiv = this.node.getElementsByClassName("prospective-content")[0];

    // Static DOT content as placeholder (from demo_test/demo_1)
    const staticDotContent = this.getStaticDotContent();

    this.dotContent = staticDotContent;
    this.renderGraph(staticDotContent, contentDiv);
  }

  getStaticDotContent(): string {
    // Static prospective provenance graph for demonstration
    return `
	strict digraph {
	    node [color=black fillcolor="#85CBC0" shape=box style=filled]
	    nodesep=0.4 size=15

	    start [label=Start]
	    node_1_script_6 [label="1: main.py" fillcolor="#85CBC0" shape=box]
	    start -> node_1_script_6
	    node_1_assign_1 [label="1: y = 10" fillcolor="#976BAA" shape=box]
	    node_1_script_6 -> node_1_assign_1
	    node_2_assign_2 [label="2: k = 40" fillcolor="#976BAA" shape=box]
	    node_1_assign_1 -> node_2_assign_2
	    node_4_for_5 [label="4: for i in range(10):\n    y = i + 1" fillcolor="#85CBC0" shape=ellipse]
	    node_2_assign_2 -> node_4_for_5
	    node_4_call_4 [label="4: range(10)" fillcolor="#85CBC0" shape=box]
	    node_4_for_5 -> node_4_call_4
	    node_5_assign_5 [label="5: y = i + 1" fillcolor="#976BAA" shape=box]
	    node_4_call_4 -> node_5_assign_5

	    end [label=End]
	    node_5_assign_5 -> end
	}
`;
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

        // Set explicit dimensions on container if needed
        (container as HTMLElement).style.width = "100%";
        (container as HTMLElement).style.height = "100%";
        (container as HTMLElement).style.overflow = "hidden";

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
    // Handle resize if needed
  }
}
