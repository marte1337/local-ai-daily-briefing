export function requireEnvironment(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
}

export function readPositiveIntegerEnvironment(name: string, defaultValue: number): number {
    const value = process.env[name]?.trim();

    if (!value) {
        return defaultValue;
    }

    if (!/^\d+$/.test(value)) {
        throw new Error(`Invalid ${name} value "${value}". Expected a positive number of days.`);
    }

    const parsed = Number.parseInt(value, 10);

    if (parsed < 1) {
        throw new Error(`${name} must be at least 1.`);
    }

    return parsed;
}
