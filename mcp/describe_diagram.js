import { topicFor } from "lib/study.js";

export const access = "public";

export default {
  name: "describe_diagram",
  description: "Give a sequential, screen-reader-friendly narration of a known DSP/FIR diagram pattern or learner-supplied text description. Does not perform image OCR or vision processing.",
  inputSchema: {
    type: "object",
    required: ["topic"],
    properties: {
      topic: { type: "string", description: "Diagram subject such as DSP architecture, FIR filter, or circular buffer." },
      diagram_description: { type: "string", description: "Optional text describing visible labels, blocks, arrows, and connections." }
    }
  },
  async handler({ topic, diagram_description }) {
    const material = topicFor(topic);
    const supplied = String(diagram_description || "").trim().slice(0, 3000);
    let description;
    let source;
    if (supplied) {
      description = "Sequential description based on the text you supplied: " + supplied + ". Start at the first stated block, follow each explicitly stated connection in order, then describe the output. Connections absent from the supplied text cannot be verified.";
      source = "Learner-supplied text description";
    } else if (material.title === "FIR filters") {
      description = "Imagine a sequence of delay blocks. The input sample enters the first position and each delay provides an older sample. Each sample branches into a multiplier paired with a filter coefficient. Multiplier outputs feed an adder or accumulator, which combines them into y[n]. The verbal flow is input, delayed samples, coefficient multiplications, summation, and output.";
      source = "Generic FIR direct-form verbal template";
    } else if (material.title === "DSP architecture") {
      description = "Start with program memory, which supplies instructions to the control path. Input samples and other values travel through data memory into registers and the processing unit. The arithmetic or MAC unit performs numerical operations, while address-generation logic determines which samples or coefficients are accessed next. Results are written to a register or data memory. A Harvard-style diagram often draws instruction and data memories separately. Exact blocks and connections depend on the processor and your course diagram.";
      source = "Generic DSP architecture verbal template";
    } else if (material.title === "Circular buffers and address generation") {
      description = "Picture a fixed row of memory locations. A pointer advances from one location to the next. At the final location, circular-addressing logic wraps the pointer to the first location. The buffer itself does not move; the address pointer wraps around.";
      source = "Generic circular-buffer verbal template";
    } else {
      description = "This version has generic verbal templates for DSP architecture, FIR filters and circular buffers. For " + material.title + ", paste the visible labels and connections so the tool can describe those details without guessing.";
      source = "Limited template; diagram details required";
    }
    return { topic: material.title, source, description, image_ocr_used: false, limitation: "No uploaded image was analysed. This tool narrates a generic template or the text description provided by the learner." };
  }
};