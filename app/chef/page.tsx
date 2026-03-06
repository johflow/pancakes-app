"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";

export default function ChefDashboard() {
const [user, setUser] = useState<User | null>(null);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [isActive, setIsActive] = useState(false);
const [ingredients, setIngredients] = useState<string[]>([]);
const [newIngredient, setNewIngredient] = useState("");
const [orders, setOrders] = useState<any[]>([]);

useEffect(() => {
const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
setUser(currentUser);
if (currentUser) loadChefData();
});
return () => unsubscribeAuth();
}, []);

const loadChefData = async () => {
const sessionRef = doc(db, "settings", "session");
onSnapshot(sessionRef, (docSnap) => {
if (docSnap.exists()) {
setIsActive(docSnap.data().isActive);
setIngredients(docSnap.data().availableIngredients || []);
} else {
setDoc(sessionRef, { isActive: false, availableIngredients: [] });
}
});

};

const handleLogin = (e: React.FormEvent) => {
e.preventDefault();
signInWithEmailAndPassword(auth, email, password).catch(err => alert(err.message));
};

const toggleSession = async () => {
await updateDoc(doc(db, "settings", "session"), { isActive: !isActive });
};

const addIngredient = async (e: React.FormEvent) => {
e.preventDefault();
if (!newIngredient) return;
const updated = [...ingredients, newIngredient];
await updateDoc(doc(db, "settings", "session"), { availableIngredients: updated });
setNewIngredient("");
};

const removeIngredient = async (ingToRemove: string) => {
const updated = ingredients.filter(i => i !== ingToRemove);
await updateDoc(doc(db, "settings", "session"), { availableIngredients: updated });
};

const updateOrderStatus = async (id: string, currentStatus: string) => {
const nextStatus = currentStatus === "In Queue" ? "Cooking" : currentStatus === "Cooking" ? "Ready" : "Completed";
await updateDoc(doc(db, "orders", id), { status: nextStatus });
};

if (!user) {
return (
<div className="min-h-screen flex items-center justify-center bg-gray-900">
<div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
<h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Chef Login</h2>
<form onSubmit={handleLogin}>
<input type="email" className="w-full p-3 mb-4 border border-gray-400 rounded bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" onChange={e => setEmail(e.target.value)} />
<input type="password" className="w-full p-3 mb-6 border border-gray-400 rounded bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" onChange={e => setPassword(e.target.value)} />
<button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded transition duration-200">Enter Kitchen</button>
</form>
</div>
</div>
);
}

return (
<div className="min-h-screen bg-gray-100 text-gray-900 py-10 px-6 font-sans">
<div className="max-w-4xl mx-auto">
<h1 className="text-4xl font-bold mb-8 text-gray-900">👨‍🍳 Chef Command Center</h1>

); }
