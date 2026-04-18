with open("server/app.py", "r") as f:
    content = f.read()

bad_try = """try:
    from backtest_engine.dsl_engine import run_dsl_backtest
from validation_engine.validation_pipeline import run_validation
    log_capture.add("✓ Backtest engine (DSL) loaded successfully")
except ImportError as e:"""

good_try = """try:
    from backtest_engine.dsl_engine import run_dsl_backtest
    from validation_engine.validation_pipeline import run_validation
    log_capture.add("✓ Backtest engine (DSL) loaded successfully")
except ImportError as e:"""

content = content.replace(bad_try, good_try)

bad_func = """            if not dsl:
                return _resp(error="Missing DSL configuration", status=400)
                
            from backtest_engine.dsl_engine import run_dsl_backtest
from validation_engine.validation_pipeline import run_validation
            
            # Start backtest execution"""

good_func = """            if not dsl:
                return _resp(error="Missing DSL configuration", status=400)
                
            from backtest_engine.dsl_engine import run_dsl_backtest
            from validation_engine.validation_pipeline import run_validation
            
            # Start backtest execution"""

content = content.replace(bad_func, good_func)

with open("server/app.py", "w") as f:
    f.write(content)
