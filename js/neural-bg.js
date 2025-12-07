// Neural Background Generator
class NeuralBackground {
    constructor() {
        this.container = null;
        this.nodes = [];
        this.connections = [];
        this.animationId = null;
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.createNodes();
        this.createConnections();
        this.animate();
    }

    createNodes() {
        const nodeCount = 50;
        const colors = ['var(--neural-blue)', 'var(--neural-purple)', 'var(--neural-pink)'];

        for (let i = 0; i < nodeCount; i++) {
            const node = document.createElement('div');
            node.className = 'neural-node';
            node.style.left = `${Math.random() * 100}%`;
            node.style.top = `${Math.random() * 100}%`;
            node.style.animationDelay = `${Math.random() * 4}s`;
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            node.style.background = color;
            node.style.boxShadow = `0 0 10px ${color}`;
            
            this.container.appendChild(node);
            this.nodes.push({
                element: node,
                x: parseFloat(node.style.left),
                y: parseFloat(node.style.top),
                vx: (Math.random() - 0.5) * 0.1,
                vy: (Math.random() - 0.5) * 0.1
            });
        }
    }

    createConnections() {
        const connectionCount = 30;

        for (let i = 0; i < connectionCount; i++) {
            const connection = document.createElement('div');
            connection.className = 'neural-connection';
            
            const x1 = Math.random() * 100;
            const y1 = Math.random() * 100;
            const x2 = Math.random() * 100;
            const y2 = Math.random() * 100;
            
            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            
            connection.style.left = `${x1}%`;
            connection.style.top = `${y1}%`;
            connection.style.width = `${length}%`;
            connection.style.transform = `rotate(${angle}deg)`;
            connection.style.animationDelay = `${Math.random() * 3}s`;
            
            this.container.appendChild(connection);
            this.connections.push(connection);
        }
    }

    animate() {
        const animate = () => {
            this.nodes.forEach(node => {
                node.x += node.vx;
                node.y += node.vy;

                if (node.x <= 0 || node.x >= 100) node.vx *= -1;
                if (node.y <= 0 || node.y >= 100) node.vy *= -1;

                node.element.style.left = `${node.x}%`;
                node.element.style.top = `${node.y}%`;
            });

            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.container.innerHTML = '';
        this.nodes = [];
        this.connections = [];
    }
}

// Initialize neural background
window.neuralBg = new NeuralBackground();
