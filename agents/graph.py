from langgraph.graph import StateGraph, START, END
from backend.models.state import VigilState

from agents.perception.ocr_agent import run_ocr
from agents.perception.normalizer import run_normalizer
from agents.perception.history_enricher import run_history_enricher
from agents.perception.persister import run_persister
from agents.reasoning.fraud_analyst import run_fraud_analyst
from agents.reasoning.health_extractor import run_health_extractor
from agents.reasoning.scoring_engine import run_scoring_engine
from agents.planning.benefits_navigator import run_benefits_navigator
from agents.planning.action_generator import run_action_generator
from agents.planning.optimization_engine import run_optimization_engine
from agents.action.watsonx_summarizer import run_watsonx_summarizer
from agents.action.report_drafter import run_report_drafter
from agents.action.compliance_gate import run_compliance_gate
from agents.action.audit_logger import run_audit_logger


def build_graph() -> StateGraph:
    graph = StateGraph(VigilState)

    # Layer 1: Perception (sequential)
    graph.add_node("ocr_agent", run_ocr)
    graph.add_node("normalizer", run_normalizer)
    graph.add_node("history_enricher", run_history_enricher)
    graph.add_node("persister", run_persister)

    # Layer 2: Reasoning (fraud_analyst and health_extractor run in parallel)
    graph.add_node("fraud_analyst", run_fraud_analyst)
    graph.add_node("health_extractor", run_health_extractor)
    graph.add_node("scoring_engine", run_scoring_engine)

    # Layer 3: Planning (sequential)
    graph.add_node("benefits_navigator", run_benefits_navigator)
    graph.add_node("action_generator", run_action_generator)
    graph.add_node("optimization_engine", run_optimization_engine)

    # Layer 4: Action (sequential)
    graph.add_node("watsonx_summarizer", run_watsonx_summarizer)
    graph.add_node("report_drafter", run_report_drafter)
    graph.add_node("compliance_gate", run_compliance_gate)
    graph.add_node("audit_logger", run_audit_logger)

    # Layer 1 edges (sequential)
    graph.add_edge(START, "ocr_agent")
    graph.add_edge("ocr_agent", "normalizer")
    graph.add_edge("normalizer", "history_enricher")
    graph.add_edge("history_enricher", "persister")

    # Layer 2 edges (parallel fan-out from persister, fan-in to scoring_engine)
    graph.add_edge("persister", "fraud_analyst")
    graph.add_edge("persister", "health_extractor")
    graph.add_edge("fraud_analyst", "scoring_engine")
    graph.add_edge("health_extractor", "scoring_engine")

    # Layer 3 edges (sequential, with WatsonX summarizer after scoring)
    graph.add_edge("scoring_engine", "watsonx_summarizer")
    graph.add_edge("watsonx_summarizer", "benefits_navigator")
    graph.add_edge("benefits_navigator", "action_generator")
    graph.add_edge("action_generator", "optimization_engine")

    # Layer 4 edges (sequential)
    graph.add_edge("optimization_engine", "report_drafter")
    graph.add_edge("report_drafter", "compliance_gate")
    graph.add_edge("compliance_gate", "audit_logger")
    graph.add_edge("audit_logger", END)

    return graph.compile()
