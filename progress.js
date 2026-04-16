const STORAGE_KEY = "babyGeniusProgress";
const DIFFICULTIES = ["easy", "medium", "hard"];
const SUBJECT_CONFIG = {
    chess: { label: "Chess", parser: parseChessDifficulty },
    math: { label: "Math", parser: parseMathDifficulty }
};

function normalizeProgressList(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return [...new Set(value.map((item) => String(item)))];
}

function createEmptyDifficultyStats() {
    return { easy: 0, medium: 0, hard: 0 };
}

function parseChessDifficulty(progressId) {
    const [difficulty] = String(progressId).split("-");
    return DIFFICULTIES.includes(difficulty) ? difficulty : null;
}

function parseMathDifficulty(progressId) {
    const parts = String(progressId).split("-");

    if (parts.length < 3) {
        return null;
    }

    const difficulty = parts[parts.length - 2];
    return DIFFICULTIES.includes(difficulty) ? difficulty : null;
}

function countProgressByDifficulty(progressType, progressIds) {
    const stats = createEmptyDifficultyStats();
    const parser = SUBJECT_CONFIG[progressType]?.parser;

    if (!parser) {
        return stats;
    }

    progressIds.forEach((progressId) => {
        const difficulty = parser(progressId);

        if (difficulty) {
            stats[difficulty] += 1;
        }
    });

    return stats;
}

function buildProgressSnapshot() {
    const progress = readProgress();
    const chessStats = countProgressByDifficulty("chess", progress.chess);
    const mathStats = countProgressByDifficulty("math", progress.math);
    const chessTotal = progress.chess.length;
    const mathTotal = progress.math.length;

    return {
        overallTotal: chessTotal + mathTotal,
        chessTotal,
        mathTotal,
        chessStats,
        mathStats
    };
}

function readProgress() {
    const savedProgress = localStorage.getItem(STORAGE_KEY);

    if (!savedProgress) {
        return { chess: [], math: [] };
    }

    try {
        const parsed = JSON.parse(savedProgress);
        return {
            chess: normalizeProgressList(parsed.chess),
            math: normalizeProgressList(parsed.math)
        };
    } catch (error) {
        return { chess: [], math: [] };
    }
}

function writeProgress(progress) {
    const normalizedProgress = {
        chess: normalizeProgressList(progress.chess),
        math: normalizeProgressList(progress.math)
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedProgress));
}

function markProgress(progressType, progressId) {
    if (!Object.prototype.hasOwnProperty.call(SUBJECT_CONFIG, progressType) || !progressId) {
        return false;
    }

    const progress = readProgress();
    const completedPuzzles = Array.isArray(progress[progressType]) ? progress[progressType] : [];
    const normalizedId = String(progressId);

    if (completedPuzzles.includes(normalizedId)) {
        return false;
    }

    progress[progressType] = [...completedPuzzles, normalizedId];
    writeProgress(progress);
    updateSettingsTracker();
    return true;
}

function resetProgress() {
    writeProgress({ chess: [], math: [] });
}

function updateSettingsTracker() {
    const progress = readProgress();
    const chessTotal = progress.chess.length;
    const mathTotal = progress.math.length;
    const overallTotal = chessTotal + mathTotal;
    const chessStats = countProgressByDifficulty("chess", progress.chess);
    const mathStats = countProgressByDifficulty("math", progress.math);
    const largestSubjectTotal = Math.max(chessTotal, mathTotal, 1);
    const overallCount = document.getElementById("overall-progress-count");
    const chessCount = document.getElementById("chess-progress-count");
    const mathCount = document.getElementById("math-progress-count");
    const chessBar = document.getElementById("chess-progress-bar");
    const mathBar = document.getElementById("math-progress-bar");
    const chessEasyCount = document.getElementById("chess-easy-count");
    const chessMediumCount = document.getElementById("chess-medium-count");
    const chessHardCount = document.getElementById("chess-hard-count");
    const mathEasyCount = document.getElementById("math-easy-count");
    const mathMediumCount = document.getElementById("math-medium-count");
    const mathHardCount = document.getElementById("math-hard-count");
    const summary = document.getElementById("progress-summary");

    if (
        !overallCount ||
        !chessCount ||
        !mathCount ||
        !chessBar ||
        !mathBar ||
        !chessEasyCount ||
        !chessMediumCount ||
        !chessHardCount ||
        !mathEasyCount ||
        !mathMediumCount ||
        !mathHardCount ||
        !summary
    ) {
        return;
    }

    overallCount.textContent = overallTotal;
    chessCount.textContent = chessTotal;
    mathCount.textContent = mathTotal;
    chessEasyCount.textContent = chessStats.easy;
    chessMediumCount.textContent = chessStats.medium;
    chessHardCount.textContent = chessStats.hard;
    mathEasyCount.textContent = mathStats.easy;
    mathMediumCount.textContent = mathStats.medium;
    mathHardCount.textContent = mathStats.hard;
    chessBar.style.width = `${(chessTotal / largestSubjectTotal) * 100}%`;
    mathBar.style.width = `${(mathTotal / largestSubjectTotal) * 100}%`;

    if (overallTotal === 0) {
        summary.textContent = "Complete a puzzle in Chess or Math to start tracking your progress.";
        return;
    }

    if (chessTotal === mathTotal) {
        summary.textContent = `You have solved ${overallTotal} puzzles, and your chess and math progress are perfectly balanced.`;
        return;
    }

    if (chessTotal > mathTotal) {
        summary.textContent = `You have solved ${overallTotal} puzzles so far, with more progress in chess right now.`;
        return;
    }

    summary.textContent = `You have solved ${overallTotal} puzzles so far, with more progress in math right now.`;
}

function setupProgressButtons() {
    const buttons = document.querySelectorAll("[data-progress-type]");

    buttons.forEach((button) => {
        const progressType = button.getAttribute("data-progress-type");
        const progressId = button.getAttribute("data-progress-id");
        const progress = readProgress();

        if (progress[progressType]?.includes(progressId)) {
            button.textContent = "Completed";
            button.disabled = true;
        }

        button.addEventListener("click", () => {
            if (markProgress(progressType, progressId)) {
                button.textContent = "Completed";
                button.disabled = true;
            }
        });
    });
}

function setupResetButton() {
    const resetButton = document.getElementById("reset-progress");

    if (!resetButton) {
        return;
    }

    resetButton.addEventListener("click", () => {
        resetProgress();
        updateSettingsTracker();
        window.location.reload();
    });
}

window.BabyGeniusProgress = {
    readProgress,
    buildProgressSnapshot,
    markProgress,
    resetProgress,
    updateSettingsTracker
};

document.addEventListener("DOMContentLoaded", () => {
    setupProgressButtons();
    updateSettingsTracker();
    setupResetButton();
});
