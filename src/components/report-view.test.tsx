import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportView } from "./report-view";
import { getCase, saveCase } from "@/lib/case-store";

// Mock the case store
const mockCases: Record<string, import("@/lib/osint/types").CaseRecord> = {};

beforeEach(() => {
  // Clear mock storage before each test
  vi.clearAllMocks();
});

describe("ReportView component", () => {
  it("renders without crashing when caseId is provided", () => {
    // Mock a case record in storage
    const mockCase: import("@/lib/osint/types").CaseRecord = {
      id: "test-123",
      target: "example.com",
      entityType: "domain",
      normalized: "example.com",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "complete" as const,
      schemaVersion: 3,
      toolVersion: "0.3.0",
      checks: [],
      findings: [],
      relationships: [],
      notes: "",
      notesUpdatedAt: null,
    };

    // @ts-expect-error - testing internal store access
    saveCase(mockCase);

    const { container } = render(<ReportView caseId="test-123" />);
    // Component should render without throwing
    expect(container.querySelector(".report-view")).toBeTruthy();
  });

  it("navigates home when case is not found", () => {
    const navigate = vi.fn();

    const { container } = render(
      <ReportView caseId="nonexistent-id" navigate={navigate} />
    );

    // Should show nothing (render null when no case found)
    expect(navigate).toHaveBeenCalledWith({ to: "/" });
    expect(container.querySelector(".report-view")).toBeFalsy();
  });

  it("shows executive summary section when case exists", () => {
    const mockCase: import("@/lib/osint/types").CaseRecord = {
      id: "test-456",
      target: "test-domain.com",
      entityType: "domain",
      normalized: "test-domain.com",
      createdAt: new Date("2024-01-01").toISOString(),
      completedAt: new Date("2024-01-02").toISOString(),
      status: "complete" as const,
      schemaVersion: 3,
      toolVersion: "0.3.0",
      checks: [],
      findings: [],
      relationships: [],
      notes: "",
      notesUpdatedAt: null,
    };

    // @ts-expect-error - testing internal store access
    saveCase(mockCase);

    const navigate = vi.fn();
    render(<ReportView caseId="test-456" navigate={navigate} />);

    // Executive summary should be present
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Executive summary"
    );
  });

  it("shows key findings section when findings exist", () => {
    const mockCase: import("@/lib/osint/types").CaseRecord = {
      id: "test-789",
      target: "test.com",
      entityType: "domain",
      normalized: "test.com",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "complete" as const,
      schemaVersion: 3,
      toolVersion: "0.3.0",
      checks: [],
      findings: [
        {
          id: "finding-1",
          classification: "observed" as const,
          statement: "Test finding statement",
          checkIds: ["check-1"],
          limitation: "Test limitation",
        },
      ],
      relationships: [],
      notes: "",
      notesUpdatedAt: null,
    };

    // @ts-expect-error - testing internal store access
    saveCase(mockCase);

    const navigate = vi.fn();
    render(<ReportView caseId="test-789" navigate={navigate} />);

    // Key findings section should be present
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Key findings"
    );
  });

  it("shows no findings message when no findings", () => {
    const mockCase: import("@/lib/osint/types").CaseRecord = {
      id: "test- no-findings",
      target: "test.com",
      entityType: "domain",
      normalized: "test.com",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "complete" as const,
      schemaVersion: 3,
      toolVersion: "0.3.0",
      checks: [],
      findings: [],
      relationships: [],
      notes: "",
      notesUpdatedAt: null,
    };

    // @ts-expect-error - testing internal store access
    saveCase(mockCase);

    const navigate = vi.fn();
    render(<ReportView caseId="test- no-findings" navigate={navigate} />);

    // Should show "No findings recorded" message
    const text = screen.getByText(
      /No findings recorded/i
    );
    expect(text).toBeTruthy();
  });

  it("shows technical observations section", () => {
    const mockCase: import("@/lib/osint/types").CaseRecord = {
      id: "test-tech-obs",
      target: "test.com",
      entityType: "domain",
      normalized: "test.com",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "complete" as const,
      schemaVersion: 3,
      toolVersion: "0.3.0",
      checks: [],
      findings: [],
      relationships: [],
      notes: "",
      notesUpdatedAt: null,
    };

    // @ts-expect-error - testing internal store access
    saveCase(mockCase);

    const navigate = vi.fn();
    render(<ReportView caseId="test-tech-obs" navigate={navigate} />);

    // Technical observations section should be present
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Technical observations"
    );
  });

  it("shows evidence and provenance table", () => {
    const mockCase: import("@/lib/osint/types").CaseRecord = {
      id: "test-evidence",
      target: "test.com",
      entityType: "domain",
      normalized: "test.com",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "complete" as const,
      schemaVersion: 3,
      toolVersion: "0.3.0",
      checks: [
        {
          id: "check-1",
          group: "dns",
          status: "completed" as const,
          label: "DNS Lookup",
          observed: "192.0.2.1",
          detail: null,
          limitation: null,
          source: { url: "https://example.com", name: "Example" } as const,
          retrievedAt: new Date().toISOString(),
          rcode: null,
          durationMs: 42,
          error: null,
        },
      ],
      findings: [],
      relationships: [],
      notes: "",
      notesUpdatedAt: null,
    };

    // @ts-expect-error - testing internal store access
    saveCase(mockCase);

    const navigate = vi.fn();
    render(<ReportView caseId="test-evidence" navigate={navigate} />);

    // Evidence table should be present
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("shows analyst assessment section", () => {
    const mockCase: import("@/lib/osint/types").CaseRecord = {
      id: "test-assessment",
      target: "test.com",
      entityType: "domain",
      normalized: "test.com",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "complete" as const,
      schemaVersion: 3,
      toolVersion: "0.3.0",
      checks: [],
      findings: [],
      relationships: [],
      notes: "",
      notesUpdatedAt: null,
    };

    // @ts-expect-error - testing internal store access
    saveCase(mockCase);

    const navigate = vi.fn();
    render(<ReportView caseId="test-assessment" navigate={navigate} />);

    // Analyst assessment section should be present
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Analyst assessment"
    );
  });

  it("shows appendix with case metadata", () => {
    const mockCase: import("@/lib/osint/types").CaseRecord = {
      id: "test-appendix",
      target: "test.com",
      entityType: "domain",
      normalized: "test.com",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "complete" as const,
      schemaVersion: 3,
      toolVersion: "0.3.0",
      checks: [],
      findings: [],
      relationships: [],
      notes: "Test notes",
      notesUpdatedAt: new Date().toISOString(),
    };

    // @ts-expect-error - testing internal store access
    saveCase(mockCase);

    const navigate = vi.fn();
    render(<ReportView caseId="test-appendix" navigate={navigate} />);

    // Appendix should be present
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Appendix"
    );
  });
});