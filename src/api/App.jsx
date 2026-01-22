import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Player from "./pages/Player"

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/play/:source/:id" element={<Player />} />
            </Routes>
        </BrowserRouter>
    )
}

