import { describe, it, expect, beforeAll } from "bun:test";
import { normalizeText, detectBlockKind, splitIntoBlocks } from "./handlers";

describe("Document Processing Helpers", () => {
  describe("normalizeText", () => {
    it("should normalize line endings", () => {
      expect(normalizeText("Line 1\r\nLine 2")).toBe("Line 1\nLine 2");
      expect(normalizeText("Line 1\rLine 2")).toBe("Line 1\nLine 2");
    });

    it("should replace non-breaking spaces", () => {
      expect(normalizeText("Hello\u00A0World")).toBe("Hello World");
    });

    it("should replace tabs with spaces", () => {
      expect(normalizeText("Hello\tWorld")).toBe("Hello World");
    });

    it("should collapse multiple spaces", () => {
      expect(normalizeText("Hello    World")).toBe("Hello World");
      expect(normalizeText("Hello\u2000\u2001World")).toBe("Hello World");
    });

    it("should collapse multiple newlines", () => {
      expect(normalizeText("Line 1\n\n\n\nLine 2")).toBe("Line 1\n\nLine 2");
    });

    it("should trim whitespace", () => {
      expect(normalizeText("  Hello World  ")).toBe("Hello World");
    });
  });

  describe("detectBlockKind", () => {
    it("should detect figure blocks", () => {
      expect(detectBlockKind("Figure 1: A diagram")).toBe("figure");
      expect(detectBlockKind("Fig. 2 shows the result")).toBe("figure");
      expect(detectBlockKind("[image]")).toBe("figure");
    });

    it("should detect table blocks", () => {
      expect(detectBlockKind("Table 1: Data")).toBe("table");
      expect(detectBlockKind("| Col1 | Col2 |\n|------|------|")).toBe("table");
    });

    it("should detect equation blocks", () => {
      expect(detectBlockKind("$x = 1$")).toBe("equation");
      expect(detectBlockKind("$$x = 1$$")).toBe("equation");
      expect(detectBlockKind("\\(x = 1\\)")).toBe("equation");
      expect(detectBlockKind("\\[x = 1\\]")).toBe("equation");
    });

    it("should default to text", () => {
      expect(detectBlockKind("This is a paragraph")).toBe("text");
      expect(detectBlockKind("Question 1. Solve for x")).toBe("text");
    });
  });

  describe("splitIntoBlocks", () => {
    it("should split by double newlines", () => {
      const text = "Paragraph 1\n\nParagraph 2\n\nParagraph 3";
      const blocks = splitIntoBlocks(text);
      expect(blocks).toHaveLength(3);
      expect(blocks[0]).toBe("Paragraph 1");
      expect(blocks[1]).toBe("Paragraph 2");
      expect(blocks[2]).toBe("Paragraph 3");
    });

    it("should handle single paragraph", () => {
      const blocks = splitIntoBlocks("Single paragraph");
      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toBe("Single paragraph");
    });

    it("should filter empty paragraphs", () => {
      const text = "Para 1\n\n\n\nPara 2";
      const blocks = splitIntoBlocks(text);
      expect(blocks).toHaveLength(2);
    });
  });
});

describe("Question Segmentation Logic", () => {
  const questionPattern = /^(?:Question\s+|Q\s*\.?\s*)?(\d+)[\.\)]\s*(.+)$/i;
  const optionPattern = /^[A-Da-d][\.\)]\s*(.+)$/;

  it("should match numbered questions", () => {
    const match = "Question 1. Solve for x".match(questionPattern);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("1");
    expect(match![2]).toBe("Solve for x");
  });

  it("should match questions without 'Question' prefix", () => {
    const match = "1. Solve for x".match(questionPattern);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("1");
    expect(match![2]).toBe("Solve for x");
  });

  it("should match questions with parenthesis", () => {
    const match = "1) Solve for x".match(questionPattern);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("1");
    expect(match![2]).toBe("Solve for x");
  });

  it("should match option A", () => {
    const match = "A. x = 5".match(optionPattern);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("x = 5");
  });

  it("should match option B with parenthesis", () => {
    const match = "B) x = 3".match(optionPattern);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("x = 3");
  });

  it("should match lowercase options", () => {
    const match = "c. x = 10".match(optionPattern);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("x = 10");
  });

  it("should not match non-options", () => {
    expect("Answer: A".match(optionPattern)).toBeNull();
    expect("1. Question".match(optionPattern)).toBeNull();
  });
});

describe("Answer Key Patterns", () => {
  const answerKeyPattern = /^(?:Answer|Ans|Key)\s*[:\-]?\s*([A-Da-d])/i;
  const answerLinePattern = /^(\d+)\s*[:\.]\s*([A-Da-d])/;

  it("should match Answer Key header with letter", () => {
    expect("Answer: A".match(answerKeyPattern)).not.toBeNull();
    expect("Ans: B".match(answerKeyPattern)).not.toBeNull();
    expect("Key -C".match(answerKeyPattern)).not.toBeNull();
  });

  it("should match answer lines", () => {
    const match = "1. A".match(answerLinePattern);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("1");
    expect(match![2]).toBe("A");
  });

  it("should match answer lines with colon", () => {
    const match = "2: B".match(answerLinePattern);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("2");
    expect(match![2]).toBe("B");
  });
});