#!/bin/bash
# Setup script for conda environment

echo "Setting up conda environment for SG-JB backend..."

# Create conda environment from environment.yml
conda env create -f environment.yml

# Activate the environment
conda activate sg-jb-backend

# Verify installation
echo "Verifying installation..."
python -c "import sklearn; import xgboost; import lightgbm; print('✅ All packages installed successfully!')"

echo ""
echo "Environment setup complete!"
echo "To activate: conda activate sg-jb-backend"
echo "To train model: python -m ml.train_model --model xgboost"
