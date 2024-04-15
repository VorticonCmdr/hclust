const dotProduct = (vecA, vecB) => {
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

const norm = (vec) => {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

// get cosine similarity between two equal-dimension vectors
const cosineSimilarity = (vecA, vecB) => {
  return dotProduct(vecA, vecB) / (norm(vecA) * norm(vecB));
};

// get euclidean distance between two equal-dimension vectors
const euclideanDistance = (a, b) => {
  const size = Math.min(a.length, b.length);
  let sum = 0;
  for (let index = 0; index < size; index++)
    sum += (a[index] - b[index]) * (a[index] - b[index]);
  return Math.sqrt(sum);
};

// get average distance between sets of indexes, given distance matrix
const averageDistance = (setA, setB, distances) => {
  let distance = 0;
  for (const a of setA) {
    for (const b of setB)
      distance += distances[a][b];
  }

  return distance / setA.length / setB.length;
};

// default onProgress function. console logs progress
const logProgress = (progress) =>
  console.log('Clustering: ', (progress * 100).toFixed(1) + '%');

// the main clustering function
const clusterData = ({
  data = [],
  key = '',
  distance = cosineSimilarity,
  linkage = averageDistance,
  onProgress = logProgress
}) => {
  // extract values from specified key
  if (key)
    data = data.map((datum) => datum[key]);

  // compute distance between each data point and every other data point
  // N x N matrix where N = data.length
  const distances = data.map((datum, index) => {
    // get distance between datum and other datum
    return data.map((otherDatum) => distance(datum, otherDatum));
  });

  // initialize clusters to match data
  const clusters = data.map((datum, index) => ({
    height: 0,
    indexes: [Number(index)]
  }));

  // keep track of all tree slices
  let clustersGivenK = [];

  // iterate through data
  for (let iteration = 0; iteration < data.length; iteration++) {
    // add current tree slice
    clustersGivenK.push(clusters.map((cluster) => cluster.indexes));

    // dont find clusters to merge when only one cluster left
    if (iteration >= data.length - 1)
      break;

    // initialize smallest distance
    let nearestDistance = Infinity;
    let nearestRow = 0;
    let nearestCol = 0;

    // upper triangular matrix of clusters
    for (let row = 0; row < clusters.length; row++) {
      for (let col = row + 1; col < clusters.length; col++) {
        // calculate distance between clusters
        const distance = linkage(
          clusters[row].indexes,
          clusters[col].indexes,
          distances
        );
        // update smallest distance
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestRow = row;
          nearestCol = col;
        }
      }
    }

    // merge nearestRow and nearestCol clusters together
    const newCluster = {
      indexes: [
        ...clusters[nearestRow].indexes,
        ...clusters[nearestCol].indexes
      ],
      height: nearestDistance,
      children: [clusters[nearestRow], clusters[nearestCol]]
    };

    // remove nearestRow and nearestCol clusters
    // splice higher index first so it doesn't affect second splice
    clusters.splice(Math.max(nearestRow, nearestCol), 1);
    clusters.splice(Math.min(nearestRow, nearestCol), 1);

    // add new merged cluster
    clusters.push(newCluster);
  }

  // assemble full list of tree slices into array where index = k
  clustersGivenK = [[], ...clustersGivenK.reverse()];

  // return useful information
  return {
    clusters: clusters[0],
    distances: distances,
    order: clusters[0].indexes,
    clustersGivenK: clustersGivenK
  };
};

module.exports = {
   euclideanDistance,
   averageDistance,
   cosineSimilarity,
   clusterData
}
