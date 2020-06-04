import React, { Component } from "react";
import {
  View,
  StyleSheet,
  Text as RNText,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image as RNImage,
} from "react-native";
import * as d3Shape from "d3-shape";

import Svg, {
  G,
  Text as SVGText,
  Path,
  Image,
  Circle,
  ClipPath,
  Defs,
} from "react-native-svg";
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const { width, height } = Dimensions.get("screen");

const colors = [
  "#0000FF",
  "#008000",
  "#FF8000",
  "#800080",
  "#01A9DB",
  "#848484",
];

class WheelOfFortune extends Component {
  constructor(props) {
    super(props);

    this.width = this.props.size ? this.props.size : width;
    this.height = this.props.size ? this.props.size : height;

    this.Rewards = this.props.rewards;
    this.RewardCount = this.Rewards.length;
    const rewardsColors = this.Rewards.map((r) => {
      const fillColor = colors[Math.floor(Math.random() * colors.length)];
      return fillColor;
    });

    this.state = {
      enabled: false,
      started: false,
      finished: false,
      winner: null,
      wheelOpacity: new Animated.Value(1),
      rewardsColors: rewardsColors,
    };

    this.numberOfSegments = this.RewardCount;
    this.fontSize = props.fontSize || 20;
    this.oneTurn = 360;
    this.angleBySegment = this.oneTurn / this.numberOfSegments;
    this.angleOffset = this.angleBySegment / 2;
    this.winner = this.props.winner
      ? this.props.winner
      : Math.floor(Math.random() * this.numberOfSegments);

    this._wheelPaths = this.makeWheel();
    this._angle = new Animated.Value(0);
    this.angle = 0;

    this.props.onRef(this);
  }

  componentWillUnmount() {
    this.props.onRef(undefined);
  }

  componentDidMount() {
    this._angle.addListener((event) => {
      if (this.state.enabled) {
        this.setState({
          enabled: false,
          finished: false,
        });
      }

      this.angle = event.value;
    });
  }

  makeWheel = () => {
    const data = Array.from({ length: this.numberOfSegments }).fill(1);
    const arcs = d3Shape.pie()(data);
    var colors = this.props.colors
      ? this.props.colors
      : [
          "#E07026",
          "#E8C22E",
          "#ABC937",
          "#4F991D",
          "#22AFD3",
          "#5858D0",
          "#7B48C8",
          "#D843B9",
          "#E23B80",
          "#D82B2B",
        ];
    return arcs.map((arc, index) => {
      const instance = d3Shape
        .arc()
        .padAngle(0.01)
        .outerRadius(this.width / 2)
        .innerRadius(this.props.innerRadius || 100);
      return {
        path: instance(arc),
        color: colors[index % colors.length],
        value: this.Rewards[index],
        centroid: instance.centroid(arc),
      };
    });
  };

  _getwinnerIndex = () => {
    const deg = Math.abs(Math.round(this.angle % this.oneTurn));
    // wheel turning counterclockwise
    if (this.angle < 0) {
      return Math.floor(deg / this.angleBySegment);
    }
    // wheel turning clockwise
    return (
      (this.numberOfSegments - Math.floor(deg / this.angleBySegment)) %
      this.numberOfSegments
    );
  };

  _onPress = () => {
    const duration = this.props.duration || 10000;

    this.setState({
      started: true,
    });
    Animated.timing(this._angle, {
      toValue:
        365 -
        this.winner * (this.oneTurn / this.numberOfSegments) +
        360 * (duration / 1000),
      duration: duration,
      useNativeDriver: true,
    }).start(() => {
      const winnerIndex = this._getwinnerIndex();
      this.setState({
        finished: true,
        winner: this._wheelPaths[winnerIndex].value,
      });
      this.props.getWinner(this._wheelPaths[winnerIndex].value, winnerIndex);
    });
  };

  _imageRender = (x, y, value, size) => (
    <Svg height="60" width="60">
      <Defs>
        <ClipPath id="clip">
          <Circle x={x} y={y} r={size / 2} />
        </ClipPath>
      </Defs>
      <Image
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid slice"
        opacity="1"
        href={value}
        clipPath="url(#clip)"
      />
    </Svg>
  );

  _textRender = (x, y, value, size, i, rotation) => {
    const { rewardsColors } = this.state;
    const fillColor = rewardsColors[i];
    return (
      <Svg height="70" width="70">
        <Circle stroke="#2162cc" fill={fillColor} x={x} y={y} r={size / 2} />
        <SVGText
          stroke="white"
          fontSize="16"
          x={x - size / 5096}
          y={y - size / 2048}
          textAnchor="middle"
          fontWeight="bold"
          fill="white"
        >
          {value[0].toUpperCase()}
        </SVGText>
      </Svg>
    );
  };

  _renderSvgWheel = () => {
    return (
      <View style={styles.container}>
        {this._renderKnob()}
        <Animated.View
          style={{
            alignItems: "center",
            justifyContent: "center",
            transform: [
              {
                rotate: this._angle.interpolate({
                  inputRange: [-this.oneTurn, 0, this.oneTurn],
                  outputRange: [
                    `-${this.oneTurn}deg`,
                    `0deg`,
                    `${this.oneTurn}deg`,
                  ],
                }),
              },
            ],
            backgroundColor: this.props.backgroundColor
              ? this.props.backgroundColor
              : "#fff",
            width: this.width - 20,
            height: this.width - 20,
            borderRadius: (this.width - 20) / 2,
            borderWidth: this.props.borderWidth ? this.props.borderWidth : 2,
            borderColor: this.props.borderColor
              ? this.props.borderColor
              : "#fff",
            opacity: this.state.wheelOpacity,
          }}
        >
          <AnimatedSvg
            width={"100%"}
            height={"100%"}
            viewBox={`0 0 ${this.width} ${this.width}`}
            style={{
              transform: [{ rotate: `-${this.angleOffset}deg` }],
              margin: 10,
            }}
          >
            <G y={this.width / 2} x={this.width / 2}>
              {this._wheelPaths.map((arc, i) => {
                const [x, y] = arc.centroid;

                return (
                  <G key={`arc-${i}`}>
                    <Path
                      d={arc.path}
                      id={`arc-path-${i}`}
                      strokeWidth={2}
                      fill={arc.color}
                    />
                    <G
                      rotation={
                        (i * this.oneTurn) / this.numberOfSegments +
                        this.angleOffset
                      }
                      origin={`${x}, ${y}`}
                    >
                      {typeof arc.value === "object"
                        ? this._imageRender(x, y, arc.value, 60)
                        : this._textRender(
                            x,
                            y,
                            arc.value,
                            60,
                            i,
                            (i * this.oneTurn) / this.numberOfSegments +
                              this.angleOffset
                          )}
                    </G>
                  </G>
                );
              })}
            </G>
          </AnimatedSvg>
        </Animated.View>
      </View>
    );
  };

  _renderKnob = () => {
    const knobSize = this.props.knobSize ? this.props.knobSize : 20;
    // [0, this.numberOfSegments]
    const YOLO = Animated.modulo(
      Animated.divide(
        Animated.modulo(
          Animated.subtract(this._angle, this.angleOffset),
          this.oneTurn
        ),
        new Animated.Value(this.angleBySegment)
      ),
      1
    );

    return (
      <Animated.View
        style={{
          width: knobSize,
          height: knobSize * 2,
          justifyContent: "flex-end",
          zIndex: 1,
          opacity: this.state.wheelOpacity,
          transform: [
            {
              rotate: YOLO.interpolate({
                inputRange: [-1, -0.5, -0.0001, 0.0001, 0.5, 1],
                outputRange: [
                  "0deg",
                  "0deg",
                  "35deg",
                  "-35deg",
                  "0deg",
                  "0deg",
                ],
              }),
            },
          ],
        }}
      >
        <Svg
          width={knobSize}
          height={(knobSize * 100) / 57}
          viewBox={`0 0 57 100`}
          style={{ transform: [{ translateY: 8 }] }}
        >
          <RNImage
            source={
              this.props.knoobSource
                ? this.props.knoobSource
                : require("../assets/images/knoob.png")
            }
            style={{ width: knobSize, height: (knobSize * 100) / 57 }}
          />
        </Svg>
      </Animated.View>
    );
  };

  _renderTopToPlay() {
    if (this.state.started == false) {
      if (this.props.playButton) {
        return (
          <TouchableOpacity onPress={() => this._onPress()}>
            {this.props.playButton()}
          </TouchableOpacity>
        );
      } else {
        return (
          <View style={styles.modal}>
            <TouchableOpacity onPress={() => this._onPress()}>
              <RNText style={styles.startText}>TAPTOPLAY</RNText>
            </TouchableOpacity>
          </View>
        );
      }
    }
  }

  render() {
    return (
      <View style={styles.container}>
        {/** SVG WHEEL  */}
        <TouchableOpacity
          style={{
            position: "absolute",
            width: this.width,
            height: height / 2,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Animated.View style={[styles.content, { padding: 10 }]}>
            {this._renderSvgWheel()}
          </Animated.View>
        </TouchableOpacity>

        {this._renderTopToPlay()}

        {/** wheelofLuck Image  */}
      </View>
    );
  }
}
export default WheelOfFortune;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {},
  startText: {
    fontSize: 50,
    color: "#fff",
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});
