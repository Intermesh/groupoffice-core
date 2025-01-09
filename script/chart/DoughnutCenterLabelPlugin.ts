import {Chart, ChartDataset, ChartType, DefaultDataPoint} from "chart.js/auto";

declare module 'chart.js' {
	interface PluginOptionsByType<TType extends ChartType> {
		doughnutCenterLabel?: {
			fontSize?: number,
			color?: string,
			text?: string
		}
	}

	export interface ChartData<
		TType extends ChartType = ChartType,
		TData = DefaultDataPoint<TType>,
		TLabel = unknown
	> {
		labels?: TLabel[];
		xLabels?: TLabel[];
		yLabels?: TLabel[];
		datasets: ChartDataset<TType, TData>[];
		centerLabel?: string
	}
}

Chart.register({
	id: 'doughnutCenterLabel',
	afterDatasetsDraw: function (chart, _) {

		const options = chart.options;

		const ctx = chart.ctx;
		const width = chart.width;
		const height = chart.height;
		const fontSize = options.plugins?.doughnutCenterLabel?.fontSize ?? 16;
		ctx.font = fontSize + 'px Arial';
		ctx.fillStyle = options.plugins?.doughnutCenterLabel?.color ?? "black";
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		const text = chart.data.centerLabel ?? "";
		const textX = Math.round(width / 2);
		const textY = Math.round(height / 2);
		ctx.fillText(text, textX, textY);
	}
});