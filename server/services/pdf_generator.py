import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from datetime import datetime

def generate_backtest_pdf(strategy_data: dict, filepath: str) -> str:
    """ Generates a PDF report for a backtest. """
    doc = SimpleDocTemplate(filepath, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    subtitle_style = styles['Heading2']
    text_style = styles['Normal']
    
    elements = []
    
    # Title
    elements.append(Paragraph(f"Backtest Report: {strategy_data.get('ticker', 'Unknown Ticker')}", title_style))
    elements.append(Spacer(1, 12))
    
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    elements.append(Paragraph(f"Generated at: {generated_at}", text_style))
    elements.append(Spacer(1, 20))
    
    # Strategy Info
    elements.append(Paragraph("<b>Strategy Summary</b>", subtitle_style))
    
    strategy_info = [
        str(strategy_data.get('description', 'No description')),
        f"Initial Capital: ${strategy_data.get('initial_capital', 100000):,}",
        f"Position Size: {strategy_data.get('position_size', 1.0)}",
    ]
    for info in strategy_info:
        elements.append(Paragraph(info, text_style))
        elements.append(Spacer(1, 6))
        
    elements.append(Spacer(1, 20))
    
    # Performance Metrics
    metrics = strategy_data.get('overall_metrics', {})
    if metrics:
        elements.append(Paragraph("<b>Performance Metrics</b>", subtitle_style))
        
        data = [
            ["Metric", "Value"],
            ["Total Return", f"{metrics.get('total_return_pct', 0) * 100:.2f}%"],
            ["Annualized Return", f"{metrics.get('annualized_return', 0) * 100:.2f}%"],
            ["Max Drawdown", f"{metrics.get('max_drawdown', 0) * 100:.2f}%"],
            ["Sharpe Ratio", f"{metrics.get('sharpe_ratio', 0):.2f}"],
            ["Win Rate", f"{metrics.get('win_rate', 0):.2f}%"]
        ]
        
        t = Table(data, colWidths=[200, 200])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f0f10")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(t)
        elements.append(Spacer(1, 20))
        
    # Logic Map/Rules
    elements.append(Paragraph("<b>Trading Rules (Logic Map)</b>", subtitle_style))
    logic_map = strategy_data.get('logic_map', {})
    
    if logic_map:
        for phase, rules in getattr(logic_map, 'items', lambda: [])():
            if not isinstance(rules, list):
                continue
            elements.append(Paragraph(f"<i>{phase.replace('_', ' ').title()}</i>", text_style))
            for rule in rules:
                rule_text = str(rule) if not isinstance(rule, dict) else rule.get('description', str(rule))
                elements.append(Paragraph(f"• {rule_text}", text_style))
                elements.append(Spacer(1, 4))
            elements.append(Spacer(1, 10))
            
    doc.build(elements)
    return filepath
