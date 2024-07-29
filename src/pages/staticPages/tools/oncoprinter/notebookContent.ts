type NotebookContentParams = {
    filename: string | undefined;
};

export const createNotebookContent = ({ filename }: NotebookContentParams) => ({
    nbformat: 4,
    nbformat_minor: 4,
    metadata: {},
    cells: [
        {
            id: 'code_1',
            cell_type: 'code',
            execution_count: 1,
            source: [
                'import pandas as pd\n',
                'import numpy as np\n',
                'from sklearn.cluster import KMeans\n',
                'from sklearn.preprocessing import MinMaxScaler\n',
                'import matplotlib.pyplot as plt\n',
                'from mpl_toolkits.mplot3d import Axes3D\n',
            ],
        },
        {
            id: 'code_2',
            cell_type: 'code',
            execution_count: 2,
            source: [
                `df = pd.read_csv("${filename}")\n`,
                'numerical_columns = ["startPosition", "endPosition", "proteinPosStart", "proteinPosEnd"]\n',
                'X = df[numerical_columns]\n',
                'X = X.fillna(X.mean())\n',
            ],
        },
        {
            id: 'code_3',
            cell_type: 'code',
            execution_count: 3,
            source: [
                'scaler = MinMaxScaler()\n',
                'X_normalized = scaler.fit_transform(X)\n',
                'n_clusters = 3  # You can adjust this number\n',
                'kmeans = KMeans(n_clusters=n_clusters, n_init="auto", random_state=42)\n',
                'df["Cluster"] = kmeans.fit_predict(X_normalized)\n',
            ],
        },
        {
            id: 'code_4',
            cell_type: 'code',
            execution_count: 4,
            source: [
                'fig = plt.figure(figsize=(12, 10))\n',
                'ax = fig.add_subplot(111, projection="3d")\n',
                'colors = ["r", "g", "b"]\n',
                'for i in range(n_clusters):\n',
                '    cluster_points = X_normalized[df["Cluster"] == i]\n',
                '    ax.scatter(cluster_points[:, 0], cluster_points[:, 1], cluster_points[:, 2],\n',
                '               c=colors[i], label=f"Cluster {i}", alpha=0.7)\n',
                'ax.set_xlabel(f"{numerical_columns[0]} (normalized)")\n',
                'ax.set_ylabel(f"{numerical_columns[1]} (normalized)")\n',
                'ax.set_zlabel(f"{numerical_columns[2]} (normalized)")\n',
                'ax.legend()\n',
                'plt.title("3D Scatter Plot of Normalized Mutation Data")\n',
            ],
        },
    ],
});
