# Setup Instructions - Conda Environment

## Step 1: Create Conda Environment

```bash
cd /Users/azni/Projects/sg-jb/backend
conda env create -f environment.yml
```

This will create a new conda environment called `sg-jb-backend` with Python 3.11 and all required dependencies.

## Step 2: Activate the Environment

```bash
conda activate sg-jb-backend
```

## Step 3: Verify Installation

```bash
python -c "import sklearn, xgboost, lightgbm, fastapi; print('✅ All packages installed successfully!')"
```

## Step 4: Train the ML Model

```bash
python -m ml.train_model --model xgboost --output models/travel_time_model.joblib
```

You should see output showing:
- Generating synthetic data
- Training the XGBoost model
- Model performance metrics (MAE, RMSE, R2)
- Model saved confirmation

## Step 5: Run the Backend

```bash
uvicorn app.main:app --reload --port 8000
```

## Troubleshooting

**If conda command not found:**
- Make sure conda is initialized in your shell
- Run: `conda init zsh` (or `bash` depending on your shell)
- Restart your terminal

**If environment already exists:**
```bash
conda env remove -n sg-jb-backend
conda env create -f environment.yml
```

**To list all conda environments:**
```bash
conda env list
```

**To deactivate the environment:**
```bash
conda deactivate
```
