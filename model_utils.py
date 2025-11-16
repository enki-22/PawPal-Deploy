"""
Shared utilities for ML model training and loading.
This module ensures functions are available in both training and Django contexts.
"""
import numpy as np


def _ravel_column(x):
    """
    Helper to flatten a single column for TF-IDF.
    This function must be at module level for pickle/joblib serialization.
    """
    return np.ravel(x)
