"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, doc, getDoc, serverTimestamp } from "firebase/firestore";

export default function Home() {
const [sessionActive, setSessionActive] = useState(false);
const [ingredients, setIngredients] = useState<string[]>([]);
const [orders, setOrders] = useState<any[]>([]);

const [name, setName] = useState("");
const [contact, setContact] = useState("");
const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
const [orderPlaced, setOrderPlaced] = useState(false);

useEffect(() => {
const fetchSession = async () => {
const sessionDoc = await getDoc(doc(db, "settings", "session"));
if (sessionDoc.exists() && sessionDoc.data().isActive) {
setSessionActive(true);
setIngredients(sessionDoc.data().availableIngredients || []);
}
};
fetchSession();

}, []);

const handleToggleIngredient = (ingredient: string) => {
setSelectedIngredients(prev =>
prev.includes(ingredient) ? prev.filter(i => i !== ingredient) : [...prev, ingredient]
);
};

const submitOrder = async (e: React.FormEvent) => {
e.preventDefault();
if (!name) return alert("Need a name!");

};

if (!sessionActive) {
return (
<div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-10">
<div className="text-center text-3xl font-bold bg-white p-10 rounded-xl shadow-lg border border-gray-200">
Sorry, pancakes aren't being made right now! 🥞
</div>
</div>
);
}

return (
<div className="min-h-screen bg-gray-50 text-gray-900 font-sans py-10 px-6">
<div className="max-w-2xl mx-auto">
<h1 className="text-4xl font-bold mb-8 text-center text-gray-900">🥞 Will's Party Pancakes</h1>

);
}
