# Copyright (c) 2016 Universidade Federal Fluminense (UFF)
# Copyright (c) 2016 Polytechnic Institute of New York University.
# This file is part of noWorkflow.
# Please, consult the license terms in the LICENSE file.
"""Generate Prospective Provenance in DOT Format"""
from __future__ import (absolute_import, print_function,
                        division, unicode_literals)

from .analyzer import ProspectiveAnalyzer


def _escape_dot_string(s):
    """Escape special characters for DOT format"""
    if not s:
        return ""
    s = s.replace('\\', '\\\\')
    s = s.replace('"', '\\"')
    s = s.replace('\n', '\\n')
    s = s.replace('\r', '')
    return s


def _clean_node_id(first_line, comp_type, last_line):
    """Create a valid node ID without special characters"""
    clean_type = comp_type.replace('-', '_').replace('.', '_')
    return f'node_{first_line}_{clean_type}_{last_line}'


def generate_prospective_prov(trial):
    """Generate prospective provenance as Graphviz DOT format

    TODO: This is a SIMPLIFIED implementation that generates sequential graphs.
    For full prospective provenance with control flow, implement:

    1. Migrate DefinitionProvenance.py logic:
       - componentAnalyzer() method (line 714-772)
       - syntaxRulesIF() - IF/ELSE branching with True/False labels
       - syntaxRulesFOR() - Loop back-edges and end-loop edges
       - syntaxRulesTRY() - Exception handling edges
       - edge_Definition_and_Calls() - Function call -> definition edges

    2. Add graph structures from GraphDrawer.py, SyntaxWrite.py:
       - Function clustering (subgraph with dashed borders)
       - Class clustering
       - Loop variable annotations (note shapes)

    3. Add control flow edges:
       - IF True/False branches
       - Loop back-edges (dashed)
       - Loop exit edges (label="End Loop")
       - Function call edges (dashed, pointing to function_def)

    4. Filter and aggregate components properly:
       - Group related components at statement level
       - Track nesting with def_list, column tracking

    Current implementation: Basic sequential graph with syntax filtering.

    Args:
        trial: Trial object with .id attribute

    Returns:
        String containing DOT format graph
    """
    analyzer = ProspectiveAnalyzer(trial.id)
    result = analyzer.analyze(filter_type='everything')

    components = result['components']

    # QUICK FIX: Filter out granular components
    # Keep only statement-level components, not internal tokens
    keep_types = {
        'script', 'import', 'import_from',
        'function_def', 'class_def',
        'assign', 'call', 'return',
        'for', 'while', 'if', 'elif',
        'try', 'exception',
    }

    filtered = []
    for comp in components:
        first_line, last_line, comp_type, name, column = comp
        # Filter out: syntax tokens, names/literals within expressions
        if comp_type in keep_types:
            filtered.append(comp)
        elif comp_type == 'syntax' and name in ['else:', 'finally:']:
            # Keep else/finally as separate nodes
            filtered.append(comp)

    components = filtered

    lines = ['strict digraph {']
    lines.append('    node [color=black fillcolor="#85CBC0" shape=box style=filled]')
    lines.append('    nodesep=0.4 size=15')
    lines.append('')
    lines.append('    start [label=Start]')

    prev = 'start'
    for comp in components:
        first_line, last_line, comp_type, name, column = comp

        node_id = _clean_node_id(first_line, comp_type, last_line)

        name_str = name[:50] if name else comp_type
        label = _escape_dot_string(f"{first_line}: {name_str}")

        # TODO: Color should match prospective-prov scheme:
        # - #976BAA for assigns/variables
        # - #85CBC0 for calls/returns/imports
        # - white for loop annotations
        if comp_type in ['assign']:
            color = '#976BAA'
        else:
            color = '#85CBC0'

        if comp_type in ['for', 'while', 'if', 'elif']:
            shape = 'ellipse'
        else:
            shape = 'box'

        lines.append(f'    {node_id} [label="{label}" fillcolor="{color}" shape={shape}]')
        lines.append(f'    {prev} -> {node_id}')
        prev = node_id

    lines.append('')
    lines.append('    end [label=End]')
    lines.append(f'    {prev} -> end')
    lines.append('}')

    return '\n'.join(lines)
