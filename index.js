const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scoreSpan = document.querySelector('.js-score');
const startGameBtn = document.querySelector('.js-start-game-button');
const modal = document.querySelector('.js-modal');
const modalScore = modal.querySelector('.js-modal-points');

const friction = 0.99;
const x = canvas.width / 2;
const y = canvas.height / 2;

let player;
let projectiles;
let enemies;
let particles;
let animationId;
let score;

class Player {
	constructor(x, y, radius, color) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
	}

	draw() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
	}
}

class Projectile {
	constructor(x, y, radius, color, velocity) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.velocity = velocity;
	}

	draw() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
	}

	update() {
		this.draw();
		this.x = this.x + this.velocity.x;
		this.y = this.y + this.velocity.y;
	}
}

class Enemy {
	constructor(x, y, radius, color, velocity) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.velocity = velocity;
	}

	draw() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
	}

	update() {
		this.draw();
		this.x = this.x + this.velocity.x;
		this.y = this.y + this.velocity.y;
	}
}


class Particle {
	constructor(x, y, radius, color, velocity) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.velocity = velocity;
		this.alpha = 1;
	}

	draw() {
		c.save();
		c.globalAlpha = this.alpha;		
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
		c.restore();
	}

	update() {
		this.draw();
		this.velocity.x *= friction;
		this.velocity.y *= friction;
		this.x = this.x + this.velocity.x;
		this.y = this.y + this.velocity.y;
		this.alpha -= 0.01;
	}
}

const init = () => {
	player = new Player(x, y, 10, 'white');
	projectiles = [];
	enemies = [];
	particles = [];
	score = 0;
	setScoreElementsText(0);
};

const spawnEnemies = () => {
	setInterval(() => {
        const maxSize = 50;
        const minSize = 5;
		const radius = Math.random() * (maxSize - minSize) + minSize;
        let x;
        let y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? (0 - radius) : (canvas.width + radius);
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? (0 - radius) : (canvas.height + radius);
        }
        
		const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
		const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
		const velocity = {
			x: Math.cos(angle),
			y: Math.sin(angle),
		};
		enemies.push(new Enemy(x, y, radius, color, velocity));
	}, 1000);
};

const animate = () => {
	animationId = requestAnimationFrame(animate);
	c.fillStyle = 'rgba(0, 0, 0, 0.1)';
	c.fillRect(0, 0, canvas.width, canvas.height);
	player.draw();
	projectiles.forEach((projectile, projectileIndex) => {
		projectile.update();

		// removing projectiles from the array if they go out of the screen
		const projectileOffToLeft = projectile.x + projectile.radius < 0;
		const projectileOffToRight = projectile.x + projectile.radius > canvas.width;
		const projectileOffToTop = projectile.y + projectile.radius < 0;
		const projectileOffToBottom = projectile.y + projectile.radius > canvas.height;

		if (projectileOffToLeft || projectileOffToRight || projectileOffToTop || projectileOffToBottom) {
			setTimeout(() => {
				projectiles.splice(projectileIndex, 1);
			}, 0);
		}
    });
    
    // Detecting collision
	enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        const enemyPlayerDist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

		// Ending the game
        if (enemyPlayerDist - player.radius - enemy.radius  < 1) {
			modal.style.display = 'flex';
			cancelAnimationFrame(animationId);
        }
        
        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            
            if (dist - projectile.radius - enemy.radius  < 1) {
				const numOfParticles = enemy.radius * 2;
				for (let i = 0; i < numOfParticles; i++) {
					const particleRadius = (Math.random() * 1 + 1);
					
					particles.push(new Particle(projectile.x, projectile.y, particleRadius, enemy.color, {
						x: (Math.random() - 0.5) * (Math.random() * 8),
						y: (Math.random() - 0.5) * (Math.random() * 8),
					}));
				}
				
				if (enemy.radius > 20) {
					updateScore(100);
					setScoreElementsText(score)
					modal.querySelector('.js-modal-points').innerHTML = score;
					gsap.to(enemy, {
						radius: enemy.radius - 10
					});
					setTimeout(() => {
						projectiles.splice(projectileIndex, 1);
					}, 0);
				} else {
					setTimeout(() => {
						projectiles.splice(projectileIndex, 1);
						enemies.splice(enemyIndex, 1);
						updateScore(250);
					}, 0);
				}
            }
        })
	});   
	
	particles.forEach((particle, index) => {
		if (particle.alpha <= 0) {
			particles.splice(index, 1);
		} else {
			particle.update();
		}
	})
};

window.addEventListener("click", (event) => {		
	const angle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2);
	const velocity = {
		x: Math.cos(angle) * 5,
		y: Math.sin(angle) * 5,
	};

	projectiles.push(
		new Projectile(x, y, 5, 'white', {
			x: velocity.x,
			y: velocity.y,
		})
	);
});

startGameBtn.addEventListener('click', (e) => {
	// preventing the fire on start button click
	e.stopPropagation();
	
	init();
	animate();
	spawnEnemies();
	modal.style.display = 'none';
});


// Helper functions

const setScoreElementsText = (score) => {
	scoreSpan.innerText = score;
	modalScore.innerText = score;
};

const updateScore = (amount) => {
	score += amount;
	setScoreElementsText(score);
};
