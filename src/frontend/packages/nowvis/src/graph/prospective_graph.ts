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
    return `strict digraph {
	node [color=black fillcolor="#85CBC0" shape=box style=filled]
	nodesep=0.4 size=15
	start [label=Start]
	"1import1" [label="1: import csv" fillcolor="#976BAA"]
	"2import2" [label="2: import sys" fillcolor="#976BAA"]
	"3import3" [label="3: import matplotlib.pyplot as plt" fillcolor="#976BAA"]
	"6function_def10" [label="6: def run_simulation(data_a, data_b)"]
	"7assign7" [label="7: a = csv_read(data_a)" fillcolor="#976BAA"]
	"7call7" [label="7: csv_read(data_a)"]
	"8assign8" [label="8: b = csv_read(data_b)" fillcolor="#976BAA"]
	"8call8" [label="8: csv_read(data_b)"]
	"9assign9" [label="9: data = simulate(a, b)" fillcolor="#976BAA"]
	"9call9" [label="9: simulate(a, b)"]
	"10return10" [label="10: return data"]
	"12function_def17" [label="12: def csv_read(f)"]
	"13assign13" [label="13: reader = csv.reader(open(f, newline=''), delimiter=':')" fillcolor="#976BAA"]
	"13call13" [label="13: csv.reader(open(f, newline=''), delimiter=':')"]
	"14assign14" [label="14: data = []" fillcolor="#976BAA"]
	"15for16c" [label=" Variable: row
 row in reader" color="#808080" fillcolor=white shape=note]
	"15for16" [label="15: for" shape=ellipse]
	"15for16" -> "15for16c" [arrowhead=none color="#808080" style=dashed]
	"16call16" [label="16: data.append(row)"]
	"17return17" [label="17: return data"]
	"19function_def23" [label="19: def extract_column(data, column)"]
	"20assign20" [label="20: col_data = []" fillcolor="#976BAA"]
	"21for22c" [label=" Variable: row
 row in data" color="#808080" fillcolor=white shape=note]
	"21for22" [label="21: for" shape=ellipse]
	"21for22" -> "21for22c" [arrowhead=none color="#808080" style=dashed]
	"22call22" [label="22: col_data.append(float(row[column]))"]
	"23return23" [label="23: return col_data"]
	"25function_def33" [label="25: def plot(data)"]
	"27assign27" [label="27: t = extract_column(data, 0)" fillcolor="#976BAA"]
	"27call27" [label="27: extract_column(data, 0)"]
	"29assign29" [label="29: p = extract_column(data, 1)" fillcolor="#976BAA"]
	"29call29" [label="29: extract_column(data, 1)"]
	"30call30" [label="30: plt.scatter(t, p, marker='o')"]
	"31call31" [label="31: plt.xlabel('Temperature')"]
	"32call32" [label="32: plt.ylabel('Precipitation')"]
	"33call33" [label="33: plt.savefig('output.png')"]
	"36assign36" [label="36: data_a = sys.argv[1]" fillcolor="#976BAA"]
	"37assign37" [label="37: data_b = sys.argv[2]" fillcolor="#976BAA"]
	"38assign38" [label="38: data = run_simulation(data_a, data_b)" fillcolor="#976BAA"]
	"38call38" [label="38: run_simulation(data_a, data_b)"]
	"39call39" [label="39: plot(data)"]
	end [label=End]
	subgraph cluster4 {
		style=dashed
		"6function_def10"
		"7assign7"
		"7call7"
		"8assign8"
		"8call8"
		"9assign9"
		"9call9"
		"10return10"
	}
	subgraph cluster12 {
		style=dashed
		"12function_def17"
		"13assign13"
		"13call13"
		"14assign14"
		"15for16"
		"15for16c"
		"16call16"
		"17return17"
	}
	subgraph cluster19 {
		style=dashed
		"19function_def23"
		"20assign20"
		"21for22"
		"21for22c"
		"22call22"
		"23return23"
	}
	subgraph cluster24 {
		style=dashed
		"25function_def33"
		"27assign27"
		"27call27"
		"29assign29"
		"29call29"
		"30call30"
		"31call31"
		"32call32"
		"33call33"
	}
	"22call22" -> "21for22" [style=dashed]
	"16call16" -> "15for16" [style=dashed]
	"15for16" -> "17return17" [label=" End Loop"]
	"21for22" -> "23return23" [label=" End Loop"]
	"38call38" -> "6function_def10" [style=dashed]
	"7call7" -> "12function_def17" [style=dashed]
	"8call8" -> "12function_def17" [style=dashed]
	"27call27" -> "19function_def23" [style=dashed]
	"29call29" -> "19function_def23" [style=dashed]
	"39call39" -> "25function_def33" [style=dashed]
	start -> "1import1"
	"1import1" -> "2import2"
	"2import2" -> "3import3"
	"3import3" -> "12function_def17"
	"6function_def10" -> "7assign7"
	"7assign7" -> "7call7"
	"7call7" -> "8assign8"
	"8assign8" -> "8call8"
	"8call8" -> "9assign9"
	"9assign9" -> "9call9"
	"9call9" -> "10return10"
	"12function_def17" -> "13assign13"
	"13assign13" -> "13call13"
	"13call13" -> "14assign14"
	"14assign14" -> "15for16"
	"15for16" -> "16call16"
	"19function_def23" -> "20assign20"
	"20assign20" -> "21for22"
	"21for22" -> "22call22"
	"25function_def33" -> "27assign27"
	"27assign27" -> "27call27"
	"27call27" -> "29assign29"
	"29assign29" -> "29call29"
	"29call29" -> "30call30"
	"30call30" -> "31call31"
	"31call31" -> "32call32"
	"32call32" -> "33call33"
	"36assign36" -> "37assign37"
	"37assign37" -> "38assign38"
	"38assign38" -> "38call38"
	"38call38" -> "39call39"
	"39call39" -> end
}`;
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
        console.log("SVG element dimensions:", svgElement.clientWidth, svgElement.clientHeight);
        console.log("SVG viewBox:", svgElement.getAttribute("viewBox"));
        console.log("Container dimensions:", (container as HTMLElement).clientWidth, (container as HTMLElement).clientHeight);

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
      viewBox = { x: values[0], y: values[1], width: values[2], height: values[3] };
    } else {
      // If no viewBox, create one from SVG dimensions
      const bbox = svgElement.getBBox();
      viewBox = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
      svgElement.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
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

      const dx = (e.clientX - startPoint.x) * (viewBox.width / svgElement.clientWidth);
      const dy = (e.clientY - startPoint.y) * (viewBox.height / svgElement.clientHeight);

      viewBox.x = endPoint.x - dx;
      viewBox.y = endPoint.y - dy;

      svgElement.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
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
