"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const DEFAULT_SKILLS = [
    { category: "Frontend", skills: ["React", "Angular", "Vue", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind"] },
    { category: "Backend", skills: ["Node.js", "Python", "Java", "Go", "Rust", "PHP", "Ruby", "C#"] },
    { category: "Database", skills: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQL"] },
    { category: "Cloud", skills: ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform"] },
    { category: "Mobile", skills: ["React Native", "Flutter", "iOS", "Android", "Swift", "Kotlin"] },
    { category: "Other", skills: ["DevOps", "Cybersecurity", "ML/AI", "Data Science", "UI/UX", "Testing"] }
];

/**
 * @feature ADMIN_SKILLS
 * @aiNote Skills taxonomy management for the platform.
 */
export default function AdminSkillsPage() {
    const [skills, setSkills] = useState(DEFAULT_SKILLS);
    const [newSkill, setNewSkill] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Frontend");
    const [newCategory, setNewCategory] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    const addSkill = () => {
        if (!newSkill) return;

        setSkills(prev => prev.map(cat => {
            if (cat.category === selectedCategory) {
                return { ...cat, skills: [...cat.skills, newSkill] };
            }
            return cat;
        }));
        setNewSkill("");
    };

    const removeSkill = (category: string, skill: string) => {
        setSkills(prev => prev.map(cat => {
            if (cat.category === category) {
                return { ...cat, skills: cat.skills.filter(s => s !== skill) };
            }
            return cat;
        }));
    };

    const addCategory = () => {
        if (!newCategory) return;
        setSkills(prev => [...prev, { category: newCategory, skills: [] }]);
        setNewCategory("");
        setShowAddModal(false);
    };

    const removeCategory = (category: string) => {
        if (confirm(`Delete "${category}" category and all its skills?`)) {
            setSkills(prev => prev.filter(cat => cat.category !== category));
        }
    };

    const totalSkills = skills.reduce((sum, cat) => sum + cat.skills.length, 0);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Skills Taxonomy</h1>
                        <p className="text-zinc-500 mt-1">Manage platform-wide skill categories</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors"
                        >
                            + Add Category
                        </button>
                        <Link
                            href="/admin"
                            className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Total Skills</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{totalSkills}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Categories</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{skills.length}</p>
                    </div>
                </div>

                {/* Add Skill Form */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-4">Add New Skill</h3>
                    <div className="flex gap-4">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                        >
                            {skills.map(cat => (
                                <option key={cat.category} value={cat.category}>{cat.category}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="e.g., GraphQL"
                            className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                        />
                        <button
                            onClick={addSkill}
                            disabled={!newSkill}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                            Add Skill
                        </button>
                    </div>
                </div>

                {/* Skills by Category */}
                <div className="space-y-4">
                    {skills.map((category) => (
                        <div key={category.category} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{category.category}</h3>
                                    <p className="text-xs text-zinc-400">{category.skills.length} skills</p>
                                </div>
                                <button
                                    onClick={() => removeCategory(category.category)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Delete Category
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="flex flex-wrap gap-2">
                                    {category.skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="group bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
                                        >
                                            {skill}
                                            <button
                                                onClick={() => removeSkill(category.category, skill)}
                                                className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    {category.skills.length === 0 && (
                                        <p className="text-zinc-400 text-sm">No skills in this category</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Category Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Add New Category</h2>
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="e.g., Blockchain"
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addCategory}
                                    disabled={!newCategory}
                                    className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50"
                                >
                                    Add Category
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
