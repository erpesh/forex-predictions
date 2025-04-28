interface DataPoint {
    time: string;
    price: number;
    ohlcv: {
        Open: number;
        High: number;
        Low: number;
        Close: number;
        Volume: number;
    };
}

interface PredictionPoint {
    value: number;
    time: string;
}

interface Prediction {
    name: string;
    points: PredictionPoint[];
}

// Helper functions to calculate the metrics
function meanSquaredError(actual: number[], predicted: number[]): number {
    const squaredErrors = actual.map((value, index) => Math.pow(value - predicted[index], 2));
    const mse = squaredErrors.reduce((sum, error) => sum + error, 0) / actual.length;
    return mse;
}

function meanAbsoluteError(actual: number[], predicted: number[]): number {
    const absoluteErrors = actual.map((value, index) => Math.abs(value - predicted[index]));
    const mae = absoluteErrors.reduce((sum, error) => sum + error, 0) / actual.length;
    return mae;
}

function calculateDirectionAccuracy(actual: number[], predicted: number[]): number {
    let correctDirectionCount = 0;
    for (let i = 1; i < actual.length; i++) {
        const actualDirection = Math.sign(actual[i] - actual[i - 1]); // 1 for up, -1 for down, 0 for no change
        const predictedDirection = Math.sign(predicted[i] - actual[i - 1]); // Same logic for prediction
        if (actualDirection === predictedDirection) {
            correctDirectionCount++;
        }
    }
    return correctDirectionCount / (actual.length - 1); // Exclude first data point as no direction can be calculated
}

function meanAbsolutePercentageError(actual: number[], predicted: number[]): number {
    const absolutePercentageErrors = actual.map((value, index) => Math.abs((value - predicted[index]) / value));
    const mape = (absolutePercentageErrors.reduce((sum, error) => sum + error, 0) / actual.length) * 100;
    return mape;
}

function calculateR2(actual: number[], predicted: number[]): number {
    const meanActual = actual.reduce((sum, value) => sum + value, 0) / actual.length;
    const totalSumOfSquares = actual.reduce((sum, value) => sum + Math.pow(value - meanActual, 2), 0);
    const residualSumOfSquares = actual.reduce((sum, value, index) => sum + Math.pow(value - predicted[index], 2), 0);
    const r2 = 1 - residualSumOfSquares / totalSumOfSquares;
    return r2;
}

// Function to filter and calculate stats
export function calculateStats(actualData: DataPoint[], predictions: Prediction[]) {
    // Filter predictions to only have the dates that match actual data
    const filteredPredictions = filterDataByDate(actualData, predictions);

    const mseScores: number[] = [];
    const rmseScores: number[] = [];
    const maeScores: number[] = [];
    const directionAccuracies: number[] = [];
    const mapeScores: number[] = [];
    const r2Scores: number[] = [];

    // Loop through each model's predictions and calculate metrics
    filteredPredictions.forEach((predictionModel) => {
        const actualPrices: number[] = [];
        const predictedPrices: number[] = [];

        predictionModel.points.forEach((point) => {
            // Find the corresponding actual value
            const actual = actualData.find((data) => data.time == point.time);
            if (!actual) return; // Skip if no actual data for this time

            actualPrices.push(actual.price);
            predictedPrices.push(point.value);
        });

        // Calculate metrics for this prediction model
        const mse = meanSquaredError(actualPrices, predictedPrices);
        const rmse = Math.sqrt(mse);
        const mae = meanAbsoluteError(actualPrices, predictedPrices);
        const mape = meanAbsolutePercentageError(actualPrices, predictedPrices);
        const directionAccuracy = calculateDirectionAccuracy(actualPrices, predictedPrices);
        const r2 = calculateR2(actualPrices, predictedPrices);

        // Store the scores
        mseScores.push(mse);
        rmseScores.push(rmse);
        maeScores.push(mae);
        directionAccuracies.push(directionAccuracy);
        mapeScores.push(mape);
        r2Scores.push(r2);
    });

    // Return the stats
    return {
        mse: mseScores,
        rmse: rmseScores,
        mae: maeScores,
        directionAccuracy: directionAccuracies,
        mape: mapeScores,
        r2: r2Scores,
    };
}

// Function to filter predictions based on the actual data
function filterDataByDate(actualData: DataPoint[], predictionData: Prediction[]): Prediction[] {
    // Convert actual data times into a set for faster lookup
    const actualTimes = new Set(actualData.map((data) => data.time));

    // Filter predictions to only include those with matching times in the actual data
    return predictionData.map((prediction) => {
        const filteredPoints = prediction.points.filter((point) => {
            return actualTimes.has(point.time)
        });
        return { ...prediction, points: filteredPoints };
    });
}