const fs = require("node:fs/promises");
const path = require("node:path");
const { deleteMedia, saveMedia } = require("./mediaStorage");

const resources = new Map([
    ["coupons", "coupon-images"],
    ["variants", "variant-images"],
    ["website-settings", "website-settings"]
]);
const assignmentsRoot = path.resolve(__dirname, "../uploads/.content-image-assignments");

function validateResource(resource) {
    if (!resources.has(resource)) {
        const error = new Error("Unsupported image section.");
        error.statusCode = 400;
        throw error;
    }
    return resource;
}

function validateId(resource, id) {
    if (resource === "website-settings") {
        if (id !== "store") {
            const error = new Error("Invalid website settings image ID.");
            error.statusCode = 400;
            throw error;
        }
        return id;
    }

    if (!/^[1-9]\d*$/.test(id)) {
        const error = new Error("A valid image record ID is required.");
        error.statusCode = 400;
        throw error;
    }
    return id;
}

function assignmentPath(resource, id) {
    validateResource(resource);
    validateId(resource, id);
    return path.join(assignmentsRoot, resource, `${id}.json`);
}

async function readAssignment(resource, id) {
    try {
        const assignment = JSON.parse(await fs.readFile(assignmentPath(resource, id), "utf8"));
        return assignment.storageKey;
    } catch (error) {
        if (error.code === "ENOENT") return null;
        throw error;
    }
}

async function readAssignments(resource) {
    validateResource(resource);
    const directory = path.join(assignmentsRoot, resource);
    let names;
    try {
        names = await fs.readdir(directory);
    } catch (error) {
        if (error.code === "ENOENT") return {};
        throw error;
    }

    const assignments = {};
    for (const name of names.filter((fileName) => fileName.endsWith(".json"))) {
        const id = name.slice(0, -5);
        const storageKey = await readAssignment(resource, id);
        if (storageKey) assignments[id] = storageKey;
    }
    return assignments;
}

async function replaceAssignment(resource, id, storageKey) {
    const destination = assignmentPath(resource, id);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    const temporaryPath = `${destination}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify({ storageKey }), { flag: "wx" });
    try {
        await fs.rename(temporaryPath, destination);
    } catch (error) {
        await fs.rm(temporaryPath, { force: true });
        throw error;
    }
}

async function uploadContentImage(resource, id, file) {
    validateResource(resource);
    validateId(resource, id);
    const folder = resources.get(resource);
    const stored = await saveMedia(file, folder, "image");
    let committed = false;
    try {
        const previousStorageKey = await readAssignment(resource, id);
        await replaceAssignment(resource, id, stored.StorageKey);
        committed = true;
        if (previousStorageKey) await deleteMedia(previousStorageKey);
        return stored.StorageKey;
    } catch (error) {
        if (!committed) await deleteMedia(stored.StorageKey);
        throw error;
    }
}

async function removeContentImage(resource, id) {
    const previousStorageKey = await readAssignment(resource, id);
    if (!previousStorageKey) return null;
    await fs.rm(assignmentPath(resource, id), { force: true });
    await deleteMedia(previousStorageKey);
    return previousStorageKey;
}

module.exports = { readAssignment, readAssignments, removeContentImage, uploadContentImage, validateId, validateResource };
