# XOR — Neural Network Visualizer
![GitHub package.json version](https://img.shields.io/github/package-json/v/sql-hkr/xor)
![GitHub License](https://img.shields.io/github/license/sql-hkr/xor)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/sql-hkr/xor/nextjs.yml?label=deploy)

[sql-hkr.github.io/xor/](http://sql-hkr.github.io/xor/) that demonstrates training a small feed-forward neural network on toy datasets (XOR, spiral, circles, gaussians). It shows the network topology, per-connection weights, per-neuron biases, decision boundary, training loss, test loss and accuracy in realtime.

If you're learning how neural networks work (forward pass, backpropagation, optimizers), this tool helps by making the internals visible while training happens.

## Quick start

Clone and run locally:

```bash
git clone https://github.com/sql-hkr/xor.git
cd xor
pnpm install
pnpm dev
# then open http://localhost:3000 in your browser
```

## How to use the web UI

- Dataset: choose among XOR, spiral, circles, and gaussians. The app splits the generated dataset into a train set and a held-out test set (default 80/20).
- Run / Pause: starts or stops continuous training. Training runs at up to "Max steps / sec" (use the slider to throttle).
- Run One Step: performs a single training step (useful to inspect incremental changes).
- Reset: reinitializes network weights and clears training history.
- Max steps / sec: cap for how many training steps per second the visualizer will run.
- Learning rate: the optimizer step size (η).
- Batch size: number of samples used per gradient estimate. When you switch datasets the UI sets batch size to the dataset size by default; you can reduce it for stochastic updates.
- Activation: choose `tanh` or `relu` for hidden/output activations.
- Optimizer: select `SGD` or `Adam`. If Adam is selected you can tweak Beta1, Beta2 and Eps.
- Network size: change network layer sizes (example: `2,8,8,1`). First number is input dim, last is output dim.

Panels and visuals
- Network diagram: shows neurons as circles and connections as colored lines. Color and thickness indicate sign and magnitude of weights. Small colored boxes next to neurons indicate biases.
- Weights & Biases: per-layer heatmaps of weight matrices and bias vectors (bias shown as a one-column heatmap for each layer).
- Decision canvas: visualizes output (decision boundary / class probability) across the 2D input domain and overlays data points.
- Loss panel: plots training loss and test loss over time and shows test accuracy.

Interpretation tips
- If training loss decreases but test loss increases, the model is overfitting; try lowering network size or increasing regularization (not implemented here) or add noise / more samples.
- Batch size affects noise in gradient estimates. Small batch sizes produce noisy but often faster generalization.
- Learning rate that's too large makes training unstable; too small makes it slow.

## Tips for experimenting
- Try changing the network size and watch how the decision boundary changes and how test loss behaves.
- Switch between `tanh` and `relu` to see how activation nonlinearity affects training.
- Toggle optimizer to compare SGD vs Adam (Adam often needs less manual tuning of learning rate).


## License

MIT — see [LICENSE](LICENSE).
